export const maxDuration = 60;
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { renderToStaticMarkup } from 'react-dom/server';
import type { AiAnalysisResult } from '@/lib/tradingAnalysisTypes';
import { TradeReportBody } from '@/components/TradeReportBody';

function buildHtml(report: AiAnalysisResult, date: string): string {
  const body = renderToStaticMarkup(<TradeReportBody report={report} />);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
    rel="stylesheet"
  >
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            background: '#0A0A0F',
            card:       '#12121A',
            hover:      '#1A1A28',
            blue:       '#2D6FFF',
            cyan:       '#00E5FF',
            orange:     '#FFB800',
            red:        '#FF3D57',
            green:      '#00E5B0',
            primary:    '#F0F4FF',
            secondary:  '#8892AA',
            border:     '#1E2035',
          },
          fontFamily: {
            mono: ['"JetBrains Mono"', 'monospace'],
          },
        },
      },
    };
  </script>
  <style>
    :root {
      --background: #0A0A0F;
      --card:       #12121A;
      --hover:      #1A1A28;
      --blue:       #2D6FFF;
      --cyan:       #00E5FF;
      --orange:     #FFB800;
      --red:        #FF3D57;
      --green:      #00E5B0;
      --primary:    #F0F4FF;
      --secondary:  #8892AA;
      --border:     #1E2035;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      background-color: #0A0A0F;
      color: #F0F4FF;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div style="max-width:900px;margin:0 auto;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;
                padding-bottom:16px;border-bottom:1px solid #1E2035;margin-bottom:32px;">
      <div>
        <h1 style="margin:0;font-size:24px;font-weight:bold;color:#2D6FFF;">AlphaTradeX</h1>
        <p style="margin:4px 0 0;font-size:13px;color:#8892AA;">Rapport d'analyse</p>
      </div>
      <p style="margin:0;font-size:12px;color:#8892AA;">${date}</p>
    </div>

    ${body}

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #1E2035;
                display:flex;justify-content:space-between;">
      <span style="font-size:11px;color:#8892AA;">Généré par AlphaTradeX &bull; alphatradex.ai</span>
      <span style="font-size:11px;color:#8892AA;">${date}</span>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { report } = await req.json() as { report: AiAnalysisResult };
    const date = new Date().toLocaleDateString('fr-FR');
    const html = buildHtml(report, date);

    let browser;
    if (process.env.NODE_ENV === 'production') {
      const chromium = (await import('@sparticuz/chromium')).default;
      const puppeteer = (await import('puppeteer-core')).default;
      let execPath: string | undefined = process.env.CHROMIUM_PATH;
      if (!execPath) {
        try {
          execPath = await chromium.executablePath();
        } catch {
          // path.dirname(__filename) is undefined on some Vercel runtimes
        }
      }
      if (!execPath) {
        throw new Error(
          'Chromium executable path is undefined. ' +
          'Set the CHROMIUM_PATH environment variable on Vercel.',
        );
      }
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1280, height: 720 },
        executablePath: execPath,
        headless: true,
      });
    } else {
      const puppeteer = (await import('puppeteer-core')).default;
      const executablePath =
        process.env.CHROME_PATH ||
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const contentHeight = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );

    const pdfBuffer = await page.pdf({
      width: '1200px',
      height: `${contentHeight}px`,
      printBackground: true,
      pageRanges: '1',
    });

    await browser.close();

    const filename = `alphatradex-rapport-${date.replace(/\//g, '-')}.pdf`;
    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[generate-pdf] CRASH:', err);
    return new Response(
      JSON.stringify({
        error: 'PDF generation failed',
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
