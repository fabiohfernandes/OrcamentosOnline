/**
 * TESTER Discovery System
 * UI Mapping and Element Detection Engine
 * Powered by Playwright for comprehensive application discovery
 */

const { chromium } = require('playwright');
const chalk = require('chalk');
const path = require('path');

class Discovery {
    constructor(database) {
        this.db = database;
        this.browser = null;
        this.context = null;
        this.isReady = false;
        this.discoveredPages = new Map();
        this.discoveredElements = new Map();
    }

    async initialize() {
        try {
            console.log(chalk.blue('🔍 Initializing Discovery System...'));
            this.browser = await chromium.launch({
                headless: process.env.HEADLESS !== 'false',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            this.context = await this.browser.newContext({
                viewport: { width: 1920, height: 1080 },
                userAgent: 'TESTER-Discovery-Agent/1.0'
            });

            this.isReady = true;
            console.log(chalk.green('✅ Discovery System ready'));
        } catch (error) {
            console.error(chalk.red('❌ Discovery initialization failed:'), error);
            throw error;
        }
    }

    isReady() {
        return this.isReady;
    }

    async discoverApplication(targetUrl, sessionId = null) {
        if (!this.isReady) {
            throw new Error('Discovery system not initialized');
        }

        console.log(chalk.blue(`🕵️ Starting application discovery: ${targetUrl}`));

        const coverage = {
            sessionId,
            targetUrl,
            discoveredAt: new Date(),
            pages: [],
            elements: [],
            flows: [],
            forms: [],
            apis: [],
            errors: []
        };

        try {
            const page = await this.context.newPage();

            // Enable request/response interception
            page.on('request', request => {
                if (request.url().includes('/api/')) {
                    coverage.apis.push({
                        url: request.url(),
                        method: request.method(),
                        headers: request.headers(),
                        discoveredAt: new Date()
                    });
                }
            });

            page.on('console', msg => {
                if (msg.type() === 'error') {
                    coverage.errors.push({
                        type: 'console',
                        message: msg.text(),
                        url: page.url(),
                        timestamp: new Date()
                    });
                }
            });

            // Navigate to target URL
            await page.goto(targetUrl, { waitUntil: 'networkidle' });

            // Discover page structure
            const pageInfo = await this.discoverPage(page);
            coverage.pages.push(pageInfo);

            // Discover interactive elements
            const elements = await this.discoverElements(page);
            coverage.elements.push(...elements);

            // Discover forms
            const forms = await this.discoverForms(page);
            coverage.forms.push(...forms);

            // Discover navigation flows
            const flows = await this.discoverFlows(page);
            coverage.flows.push(...flows);

            // Store coverage in database
            if (sessionId && this.db) {
                await this.storeCoverage(sessionId, coverage);
            }

            await page.close();

            console.log(chalk.green(`✅ Discovery complete: ${coverage.pages.length} pages, ${coverage.elements.length} elements`));
            return coverage;

        } catch (error) {
            console.error(chalk.red('❌ Discovery failed:'), error);
            coverage.errors.push({
                type: 'discovery',
                message: error.message,
                stack: error.stack,
                timestamp: new Date()
            });
            throw error;
        }
    }

    async discoverPage(page) {
        const pageInfo = {
            url: page.url(),
            title: await page.title(),
            viewport: await page.viewportSize(),
            loadTime: null,
            meta: {},
            structure: {}
        };

        try {
            // Analyze page structure
            const structure = await page.evaluate(() => {
                return {
                    hasNavigation: !!document.querySelector('nav, [role="navigation"], .navbar, .nav'),
                    hasHeader: !!document.querySelector('header, .header'),
                    hasFooter: !!document.querySelector('footer, .footer'),
                    hasSidebar: !!document.querySelector('aside, .sidebar, .side-nav'),
                    hasMain: !!document.querySelector('main, .main, .content'),
                    elementCount: document.querySelectorAll('*').length,
                    linkCount: document.querySelectorAll('a[href]').length,
                    formCount: document.querySelectorAll('form').length,
                    inputCount: document.querySelectorAll('input, textarea, select').length,
                    buttonCount: document.querySelectorAll('button, [type="button"], [type="submit"]').length,
                    imageCount: document.querySelectorAll('img').length
                };
            });

            pageInfo.structure = structure;

            // Extract meta information
            const meta = await page.evaluate(() => {
                const metaTags = {};
                document.querySelectorAll('meta').forEach(meta => {
                    const name = meta.getAttribute('name') || meta.getAttribute('property');
                    const content = meta.getAttribute('content');
                    if (name && content) {
                        metaTags[name] = content;
                    }
                });
                return metaTags;
            });

            pageInfo.meta = meta;

        } catch (error) {
            console.warn(chalk.yellow('⚠️ Page analysis partial failure:'), error.message);
        }

        return pageInfo;
    }

    async discoverElements(page) {
        const elements = [];

        try {
            const interactiveElements = await page.evaluate(() => {
                const selectors = [
                    'button',
                    'a[href]',
                    'input',
                    'textarea',
                    'select',
                    '[onclick]',
                    '[role="button"]',
                    '[tabindex]',
                    '.btn',
                    '.button',
                    '.link'
                ];

                return selectors.flatMap(selector => {
                    return Array.from(document.querySelectorAll(selector)).map((el, index) => ({
                        selector: `${selector}:nth-of-type(${index + 1})`,
                        tagName: el.tagName.toLowerCase(),
                        type: el.type || null,
                        text: el.textContent?.trim().substring(0, 100) || '',
                        href: el.href || null,
                        id: el.id || null,
                        className: el.className || null,
                        role: el.getAttribute('role') || null,
                        isVisible: el.offsetParent !== null,
                        boundingBox: {
                            x: el.getBoundingClientRect().x,
                            y: el.getBoundingClientRect().y,
                            width: el.getBoundingClientRect().width,
                            height: el.getBoundingClientRect().height
                        }
                    }));
                });
            });

            interactiveElements.forEach(element => {
                elements.push({
                    ...element,
                    pageUrl: page.url(),
                    discoveredAt: new Date()
                });
            });

        } catch (error) {
            console.warn(chalk.yellow('⚠️ Element discovery partial failure:'), error.message);
        }

        return elements;
    }

    async discoverForms(page) {
        const forms = [];

        try {
            const formData = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('form')).map((form, index) => ({
                    selector: `form:nth-of-type(${index + 1})`,
                    action: form.action || '',
                    method: form.method || 'get',
                    inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
                        name: input.name || '',
                        type: input.type || 'text',
                        required: input.required || false,
                        placeholder: input.placeholder || '',
                        value: input.value || ''
                    })),
                    buttons: Array.from(form.querySelectorAll('button, [type="submit"]')).map(btn => ({
                        text: btn.textContent?.trim() || '',
                        type: btn.type || 'button'
                    }))
                }));
            });

            formData.forEach(form => {
                forms.push({
                    ...form,
                    pageUrl: page.url(),
                    discoveredAt: new Date()
                });
            });

        } catch (error) {
            console.warn(chalk.yellow('⚠️ Form discovery partial failure:'), error.message);
        }

        return forms;
    }

    async discoverFlows(page) {
        const flows = [];

        try {
            // Detect common navigation patterns
            const navigationFlows = await page.evaluate(() => {
                const flows = [];

                // Login flow detection
                const loginElements = document.querySelectorAll('[type="password"], input[name*="password"], input[id*="password"]');
                if (loginElements.length > 0) {
                    flows.push({
                        type: 'authentication',
                        name: 'Login Flow',
                        elements: Array.from(loginElements).map(el => ({
                            selector: el.name || el.id || el.className,
                            type: el.type
                        }))
                    });
                }

                // Checkout flow detection
                const checkoutElements = document.querySelectorAll('[name*="checkout"], [id*="checkout"], .checkout, .cart');
                if (checkoutElements.length > 0) {
                    flows.push({
                        type: 'ecommerce',
                        name: 'Checkout Flow',
                        elements: Array.from(checkoutElements).map(el => ({
                            selector: el.name || el.id || el.className,
                            type: el.tagName.toLowerCase()
                        }))
                    });
                }

                // Contact form detection
                const contactElements = document.querySelectorAll('[name*="contact"], [id*="contact"], [name*="email"], [type="email"]');
                if (contactElements.length > 0) {
                    flows.push({
                        type: 'contact',
                        name: 'Contact Flow',
                        elements: Array.from(contactElements).map(el => ({
                            selector: el.name || el.id || el.className,
                            type: el.type || el.tagName.toLowerCase()
                        }))
                    });
                }

                return flows;
            });

            navigationFlows.forEach(flow => {
                flows.push({
                    ...flow,
                    pageUrl: page.url(),
                    discoveredAt: new Date()
                });
            });

        } catch (error) {
            console.warn(chalk.yellow('⚠️ Flow discovery partial failure:'), error.message);
        }

        return flows;
    }

    async storeCoverage(sessionId, coverage) {
        try {
            // Store coverage map in database
            for (const element of coverage.elements) {
                await this.db.query(`
                    INSERT INTO coverage_map (session_id, page_url, element_role, element_text, element_selector, element_metadata)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    sessionId,
                    element.pageUrl,
                    element.role || element.tagName,
                    element.text,
                    element.selector,
                    JSON.stringify({
                        type: element.type,
                        boundingBox: element.boundingBox,
                        isVisible: element.isVisible,
                        href: element.href,
                        className: element.className
                    })
                ]);
            }

            console.log(chalk.green('✅ Coverage data stored in database'));
        } catch (error) {
            console.error(chalk.red('❌ Failed to store coverage:'), error);
        }
    }

    async cleanup() {
        if (this.context) {
            await this.context.close();
        }
        if (this.browser) {
            await this.browser.close();
        }
        this.isReady = false;
        console.log(chalk.yellow('🔍 Discovery system cleaned up'));
    }
}

module.exports = Discovery;