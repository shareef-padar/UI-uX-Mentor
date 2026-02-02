
import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const GEN_AI_KEY = process.env.GEMINI_API_KEY;

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

        // 2. Initial Code Analysis Data
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
            lawsObservation: [],
            flowAnalysis: "Analyzing...",
            aiEnabled: false,
            debugError: null
        };

        // Basic Code Heuristics
        if (analysis.h1Count === 1) analysis.good.push("Semantic HTML: Page has exactly one H1 tag.");
        else if (analysis.h1Count === 0) analysis.bad.push("SEO Issue: Missing H1 tag.");
        else analysis.bad.push(`SEO Issue: Multiple H1 tags found (${analysis.h1Count}).`);

        if (analysis.missingAlt === 0 && analysis.totalImages > 0) analysis.good.push("Accessibility: All images have alt tags.");
        else if (analysis.missingAlt > 0) analysis.bad.push(`Accessibility: ${analysis.missingAlt} images are missing alt text.`);

        if (analysis.metaDescription.length > 50) analysis.good.push("SEO: Meta description is present.");
        else analysis.improvements.push("SEO: Add a descriptive meta description.");

        // Calculate Code-Only Baseline Scores
        let codeScore = 70;
        if (analysis.bad.length > 0) codeScore -= (analysis.bad.length * 5);
        if (analysis.good.length > 0) codeScore += (analysis.good.length * 2);
        analysis.scores.ux = codeScore;
        analysis.scores.ui = codeScore; // Placeholder
        analysis.scores.accessibility = codeScore + (analysis.missingAlt === 0 ? 10 : -10);


        // 3. Visual Analysis (Screenshot + AI)
        if (GEN_AI_KEY) {
            console.log("Gemini API Key found. Starting Visual Analysis...");

            try {
                browser = await getBrowser();
                const page = await browser.newPage();
                await page.setViewport({ width: 1280, height: 800 });

                // Goto URL
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

                // Capture Screenshot
                const screenshotBuffer = await page.screenshot({ encoding: 'base64' });

                // Call Gemini
                // Note: Using gemini-2.0-flash as it is supported by this API key.
                const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.0-flash",
                    generationConfig: { responseMimeType: "application/json" }
                });

                const prompt = `
### ROLE
You are a world-class Senior UX Auditor and Conversion Rate Optimization (CRO) Expert. Analyze this screenshot of a website.

### ANALYSIS GUIDELINES
1.  **UX Laws**: Identify which "Laws of UX" (e.g., Fitts's Law, Hick's Law, Jakob's Law, Miller's Law, Zeigarnik Effect) are being followed or violated.
2.  **Visual Hierarchy**: Grade the visual hierarchy from A to F based on how well it guides the user's eye to the primary CTA.
3.  **Critical Issues**: Focus on friction points, confusing layouts, or accessibility violations.
4.  **Actionable Fixes**: Every issue must have a clear, step-by-step fix.

### OUTPUT REQUIREMENTS
Return ONLY a valid JSON object:
{
  "ux_score": (Number 0-100),
  "accessibility_score": (Number 0-100),
  "visual_hierarchy_grade": "A-F",
  "conversion_optimization": "Brief strategic advice",
  "critical_issues": [
    {
      "element": "Name of the UI element",
      "issue": "Description of the problem",
      "law_violated": "Name of the specific UX Law",
      "severity": "Critical | Warning | Suggestion",
      "fix": "Specific recommendation"
    }
  ]
}
                `;

                const imagePart = {
                    inlineData: {
                        data: screenshotBuffer,
                        mimeType: "image/png",
                    },
                };

                const result = await model.generateContent([prompt, imagePart]);
                const textResponse = result.response.text();
                console.log("Gemini Raw Response:", textResponse);
                const aiData = JSON.parse(textResponse);

                // Merge AI Data
                analysis.scores.ux = aiData.ux_score;
                const gradeMap = { 'A': 95, 'B': 85, 'C': 75, 'D': 65, 'F': 50 };
                analysis.scores.ui = gradeMap[aiData.visual_hierarchy_grade?.[0]?.toUpperCase()] || 70;
                analysis.scores.accessibility = aiData.accessibility_score;

                analysis.lawsObservation = []; // Clear and replace with AI data

                aiData.critical_issues.forEach(issue => {
                    const formattedIssue = `**${issue.element}**: ${issue.issue} (${issue.severity.toUpperCase()}) - Fix: ${issue.fix}`;
                    if (issue.severity.toLowerCase().includes('critical') || issue.severity.toLowerCase().includes('warning')) {
                        analysis.bad.push(formattedIssue);
                    } else {
                        analysis.improvements.push(formattedIssue);
                    }

                    analysis.lawsObservation.push({
                        law: {
                            name: issue.law_violated,
                            summary: `Strategic application of ${issue.law_violated} for improved UX.`
                        },
                        status: (issue.severity.toLowerCase().includes('critical') || issue.severity.toLowerCase().includes('warning')) ? 'violated' : 'suggestion',
                        observation: issue.issue
                    });
                });

                analysis.flowAnalysis = aiData.conversion_optimization;
                analysis.improvements.push(`**Visual Hierarchy Grade**: ${aiData.visual_hierarchy_grade}`);
                analysis.aiEnabled = true;

            } catch (visualError) {
                console.error("Visual Analysis Final Error:", visualError);

                // User-friendly error mapping
                let errorMessage = visualError.message;
                let troubleshooting = null;

                if (visualError.message.includes('429') || visualError.message.toLowerCase().includes('quota')) {
                    errorMessage = "AI Rate Limit Reached";
                    troubleshooting = "You've hit the free tier quota for today or are sending requests too quickly. Please wait 60 seconds and try again.";
                } else if (visualError.message.includes('not found')) {
                    troubleshooting = "The Gemini model 'gemini-2.0-flash' might not be enabled for your API key. Check Google AI Studio.";
                }

                analysis.debugError = `Visual/AI Error: ${visualError.message}`;
                analysis.bad.push(`**Visual Analysis Failed**: ${errorMessage}. Falling back to Code Analysis.`);

                if (troubleshooting) {
                    analysis.bad.push(`**Troubleshooting**: ${troubleshooting}`);
                }
            }
        } else {
            analysis.bad.push("Visual Analysis Skipped: Server Key Missing.");
        }

        return NextResponse.json(analysis);

    } catch (error) {
        console.error("Critical Analysis Error:", error);
        return NextResponse.json({ error: 'System Error', details: error.message }, { status: 500 });
    } finally {
        if (browser) await browser.close();
    }
}
