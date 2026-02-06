
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

// Helper to launch browser compatible with Vercel or Local
async function getBrowser() {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        console.log("Launching Puppeteer Core for Vercel...");
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
        console.log("Launching Local Puppeteer...");
        try {
            const puppeteer = await import('puppeteer');
            return await puppeteer.default.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        } catch (e) {
            console.log("Local puppeteer not found, trying core with default paths...", e);
            return await puppeteerCore.launch({
                channel: 'chrome',
                headless: "new"
            });
        }
    }
}

export async function POST(request) {
    let browser = null;
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        console.log(`Analyzing URL: ${url}`);

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

        // 2. Initial Base Analysis Data (Empty, will be populated by AI)
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
        if (XAI_KEY && XAI_KEY !== 'your_xai_api_key_here') {
            console.log("XAI API Key found. Starting Visual Analysis with Grok...");

            try {
                analysis.status = "Launching Browser";
                browser = await getBrowser();
                analysis.status = "Browser Launched";
                const page = await browser.newPage();
                await page.setViewport({ width: 1280, height: 800 });

                // Goto URL
                analysis.status = "Navigating to Site";
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                analysis.status = "Capturing Visual State";

                // Capture Screenshot (Optimized for Grok API)
                const screenshotBuffer = await page.screenshot({
                    encoding: 'base64',
                    type: 'jpeg',
                    quality: 80
                });
                analysis.status = "Calling AI Auditor";

                // Call xAI (Grok)
                const response = await axios.post(
                    "https://api.x.ai/v1/chat/completions",
                    {
                        model: "grok-2-vision-1212",
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text", text: `
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
` },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: `data:image/jpeg;base64,${screenshotBuffer}`,
                                        },
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

                analysis.status = "Parsing Grok Response";
                const aiData = response.data.choices[0].message.content;
                console.log("Grok Raw Response:", aiData);
                const parsedAiData = typeof aiData === 'string' ? JSON.parse(aiData) : aiData;

                // Merge 100% AI-Driven Data
                analysis.scores.ux = parsedAiData.ux_score || 0;
                analysis.scores.ui = parsedAiData.ui_score || 0;
                analysis.scores.accessibility = parsedAiData.accessibility_score || 0;

                analysis.good = parsedAiData.good_points || [];
                analysis.bad = parsedAiData.bad_points || [];
                analysis.flowAnalysis = parsedAiData.conversion_optimization || "Analysis complete.";
                analysis.improvements = [`**Visual Hierarchy Grade**: ${parsedAiData.visual_hierarchy_grade || 'N/A'}`];

                analysis.lawsObservation = [];

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

                analysis.flowAnalysis = parsedAiData.conversion_optimization || "No CRO advice provided.";
                analysis.improvements.push(`**Visual Hierarchy Grade**: ${parsedAiData.visual_hierarchy_grade || 'N/A'}`);
                analysis.aiEnabled = true;

            } catch (visualError) {
                console.error("Visual Analysis Final Error (Grok):", visualError);
                analysis.status = `Analysis Failed: ${visualError.message}`;
                analysis.debugError = visualError.message;

                let errorMessage = visualError.message;
                let troubleshooting = null;

                if (visualError.response?.status === 429) {
                    errorMessage = "Grok Rate Limit Reached";
                    troubleshooting = "You've hit the Grok API rate limit. Please wait and try again.";
                } else if (visualError.response?.status === 401) {
                    errorMessage = "Invalid API Key";
                    troubleshooting = "Your Grok API Key seems invalid. Please check your .env.local file.";
                }

                analysis.bad.push(`**Visual Analysis Failed (Grok)**: ${errorMessage}.`);

                if (troubleshooting) {
                    analysis.bad.push(`**Troubleshooting**: ${troubleshooting}`);
                }
            }
        } else if (GEN_AI_KEY) {
            analysis.status = "Skipped Grok (Fallback to Gemini)";
            analysis.bad.push("XAI API Key missing. Skipping Visual Analysis.");
        } else {
            analysis.status = "Skipped (No Keys)";
            analysis.bad.push("Visual Analysis Skipped: Server Key Missing.");
        }

        console.log("FINAL ANALYSIS RESPONSE:", JSON.stringify(analysis, null, 2));
        return NextResponse.json(analysis);

    } catch (error) {
        console.error("Critical Analysis Error:", error);
        return NextResponse.json({
            error: 'System Error',
            details: error.message,
            status: "Fatal Error"
        }, { status: 500 });
    } finally {
        if (browser) await browser.close();
    }
}
