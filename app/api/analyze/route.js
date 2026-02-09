
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const GEN_AI_KEY = process.env.GEMINI_API_KEY;
const XAI_KEY = process.env.XAI_API_KEY;

const SHARED_PROMPT = `
### ROLE
You are a world-class Senior UX/UI Auditor and Conversion Rate Optimization (CRO) Expert. Your goal is to provide deep, professional, and actionable feedback on the provided website.

### ANALYSIS GUIDELINES
1.  **UX Laws**: Identify which "Laws of UX" (e.g., Fitts's Law, Hick's Law, Jakob's Law, Miller's Law, Zeigarnik Effect) are implemented well or poorly.
2.  **Visual Hierarchy & Aesthetics**: Grade the visual hierarchy, typography, color harmony, and overall professional feel.
3.  **Positive Highlights**: Find 3-5 specific UI/UX wins where the site performs exceptionally.
4.  **Critical Issues (Bad Points)**: Identify 3-5 friction points, confusing layouts, or conversion blockers.
5.  **Actionable Improvements**: For every issue, provide a clear, step-by-step fix that a developer or designer can follow.

### OUTPUT REQUIREMENTS
Return ONLY a valid JSON object:
{
  "ux_score": (Number 0-100),
  "ui_score": (Number 0-100),
  "accessibility_score": (Number 0-100),
  "visual_hierarchy_grade": "A-F",
  "conversion_optimization": "In-depth strategic advice for conversion",
  "good_points": ["Specific positive detail 1", "Specific positive detail 2"],
  "bad_points": ["Specific negative detail 1", "Specific negative detail 2"],
  "critical_issues": [
    {
      "element": "Name of the UI element",
      "issue": "Detailed description of the problem",
      "law_violated": "Name of the specific UX Law",
      "severity": "Critical | Warning | Suggestion",
      "fix": "Specific, professional recommendation"
    }
  ]
}
`;

// Helper to launch browser compatible with Vercel or Local
async function getBrowser() {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        try {
            return await puppeteerCore.launch({
                args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'),
                headless: chromium.headless,
            });
        } catch (error) {
            console.error("Failed to launch Vercel browser:", error);
            throw new Error(`Vercel Browser Launch Failed: ${error.message}`);
        }
    } else {
        try {
            const puppeteer = await import('puppeteer');
            return await puppeteer.default.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        } catch (e) {
            return await puppeteerCore.launch({
                channel: 'chrome',
                headless: "new"
            });
        }
    }
}

async function runGrokAnalysis(screenshotBase64) {
    const response = await axios.post(
        "https://api.x.ai/v1/chat/completions",
        {
            model: "grok-2-vision-1212",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: SHARED_PROMPT },
                        {
                            type: "image_url",
                            image_url: { url: `data:image/jpeg;base64,${screenshotBase64}` },
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" }
        },
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${XAI_KEY}`,
            },
        }
    );
    return response.data.choices[0].message.content;
}

async function runGeminiAnalysis(screenshotBase64) {
    const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    const result = await model.generateContent([
        SHARED_PROMPT,
        {
            inlineData: {
                data: screenshotBase64,
                mimeType: "image/jpeg"
            }
        }
    ]);

    const text = result.response.text();
    // Clean potential markdown wrap
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

export async function POST(request) {
    let browser = null;
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // 1. Fetch HTML (Code Analysis)
        let html = '';
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });
            html = response.data;
        } catch (fetchError) {
            console.error("HTML Fetch Error:", fetchError.message);
            return NextResponse.json({ error: 'Failed to fetch URL', details: fetchError.message }, { status: 400 });
        }

        const $ = cheerio.load(html);

        // 2. Initial Base Analysis Data
        const analysis = {
            url,
            title: $('title').text().trim(),
            metaDescription: $('meta[name="description"]').attr('content') || '',
            h1Count: $('h1').length,
            missingAlt: $('img:not([alt])').length,
            totalImages: $('img').length,
            links: $('a').length,
            scores: { ux: 0, ui: 0, accessibility: 0 },
            good: [],
            bad: [],
            improvements: [],
            actionItems: [],
            lawsObservation: [],
            flowAnalysis: "Analyzing...",
            aiEnabled: false,
            debugError: null,
            status: "Initialized"
        };

        // 3. Visual Analysis (Screenshot + AI)
        try {
            browser = await getBrowser();
            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            const screenshotBuffer = await page.screenshot({
                encoding: 'base64',
                type: 'jpeg',
                quality: 80
            });

            let aiDataText = null;
            let usedModel = "None";

            // Attempt Grok first
            if (XAI_KEY && XAI_KEY !== 'your_xai_api_key_here') {
                try {
                    aiDataText = await runGrokAnalysis(screenshotBuffer);
                    usedModel = "Grok-2";
                } catch (grokError) {
                    console.error("Grok Failed, trying Gemini fallback...", grokError.message);
                }
            }

            // Fallback to Gemini if Grok skipped or failed
            if (!aiDataText && GEN_AI_KEY) {
                try {
                    aiDataText = await runGeminiAnalysis(screenshotBuffer);
                    usedModel = "Gemini Pro";
                } catch (geminiError) {
                    console.error("Gemini Also Failed:", geminiError.message);
                    analysis.debugError = geminiError.message;
                }
            }

            if (aiDataText) {
                const parsedAiData = typeof aiDataText === 'string' ? JSON.parse(aiDataText) : aiDataText;

                // Merge Data
                analysis.scores.ux = parsedAiData.ux_score || parsedAiData.score || 0;
                analysis.scores.ui = parsedAiData.ui_score || 0;
                analysis.scores.accessibility = parsedAiData.accessibility_score || 0;
                analysis.good = parsedAiData.good_points || [];
                analysis.bad = parsedAiData.bad_points || [];
                analysis.flowAnalysis = parsedAiData.conversion_optimization || "Analysis complete.";
                analysis.improvements = [`**Visual Hierarchy Grade**: ${parsedAiData.visual_hierarchy_grade || 'N/A'}`];

                if (parsedAiData.critical_issues) {
                    parsedAiData.critical_issues.forEach(issue => {
                        analysis.actionItems.push({
                            element: issue.element,
                            issue: issue.issue,
                            severity: issue.severity,
                            fix: issue.fix
                        });

                        analysis.lawsObservation.push({
                            law: {
                                name: issue.law_violated,
                                summary: `Strategic application of ${issue.law_violated} for improved UX.`
                            },
                            status: (issue.severity.toLowerCase().includes('critical') || issue.severity.toLowerCase().includes('warning')) ? 'violated' : 'suggestion',
                            observation: issue.issue
                        });
                    });
                }
                analysis.aiEnabled = true;
            } else {
                analysis.bad.push("Could not reach any AI models for visual analysis. Please check your API keys.");
            }

        } catch (fatalError) {
            console.error("Visual Analysis Error:", fatalError);
            analysis.bad.push(`Visual analysis failed: ${fatalError.message}`);
        }

        // Create clean response object for production
        const finalResponse = {
            url: analysis.url,
            title: analysis.title,
            scores: analysis.scores,
            good: analysis.good,
            bad: analysis.bad,
            improvements: analysis.improvements,
            actionItems: analysis.actionItems,
            lawsObservation: analysis.lawsObservation,
            flowAnalysis: analysis.flowAnalysis,
            aiEnabled: analysis.aiEnabled
        };

        return NextResponse.json(finalResponse);

    } catch (error) {
        console.error("Critical System Error:", error);
        return NextResponse.json({
            error: 'System Error',
            details: error.message
        }, { status: 500 });
    } finally {
        if (browser) await browser.close();
    }
}
