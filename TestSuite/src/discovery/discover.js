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
            errors: [],
            features: [],
            testingScope: {}
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

            // Discover application features
            const features = await this.discoverFeatures(page);
            coverage.features.push(...features);

            // Generate testing scope
            coverage.testingScope = await this.generateTestingScope(coverage);

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

                // Helper function to generate reliable selectors
                const generateReliableSelector = (el) => {
                    // Priority 1: Use ID if available
                    if (el.id) {
                        return `#${el.id}`;
                    }

                    // Priority 2: Use specific class combinations with uniqueness check
                    if (el.className) {
                        const classes = el.className.split(' ').filter(c => c.trim());
                        if (classes.length > 0) {
                            // Try to create a unique selector by combining classes or adding parent context
                            let selector = `${el.tagName.toLowerCase()}.${classes[0]}`;

                            // Check if this selector would match multiple elements
                            const matchCount = document.querySelectorAll(selector).length;
                            if (matchCount > 1) {
                                // Make it more specific by adding text content or parent context
                                const text = el.textContent?.trim();
                                if (text && text.length < 50) {
                                    // Use getByText for Playwright text matching
                                    return `text=${text.replace(/"/g, '\\"')}`;
                                }

                                // Add parent context if available
                                const parent = el.parentElement;
                                if (parent && parent.className) {
                                    const parentClass = parent.className.split(' ')[0];
                                    return `${parent.tagName.toLowerCase()}.${parentClass} ${selector}`;
                                }

                                // Use multiple classes if available
                                if (classes.length > 1) {
                                    return `${el.tagName.toLowerCase()}.${classes.slice(0, 2).join('.')}`;
                                }
                            }

                            return selector;
                        }
                    }

                    // Priority 3: Use href for links
                    if (el.tagName === 'A' && el.href) {
                        const url = new URL(el.href);
                        return `a[href="${url.pathname}"]`;
                    }

                    // Priority 4: Use text content for buttons/links (use data attributes or unique positioning)
                    const text = el.textContent?.trim();
                    if (text && text.length < 50 && text.length > 2) {
                        // Use more specific selector based on parent structure
                        const parent = el.parentElement;
                        if (parent && parent.className) {
                            return `${parent.tagName.toLowerCase()}.${parent.className.split(' ')[0]} ${el.tagName.toLowerCase()}`;
                        }
                    }

                    // Priority 5: Use role attribute
                    if (el.getAttribute('role')) {
                        return `[role="${el.getAttribute('role')}"]`;
                    }

                    // Fallback: Use xpath-style selector based on element position and content
                    const parent = el.parentElement;
                    if (parent) {
                        const text = el.textContent?.trim();
                        const tag = el.tagName.toLowerCase();

                        // Create highly specific selector using content and structure
                        if (text && text.length > 0 && text.length < 100) {
                            // Use text content as discriminator for Playwright
                            return `text=${text.replace(/"/g, '\\"')}`;
                        }

                        // Use attributes as discriminator
                        const attributes = [];
                        if (el.type) attributes.push(`[type="${el.type}"]`);
                        if (el.value) attributes.push(`[value="${el.value}"]`);
                        if (el.title) attributes.push(`[title="${el.title}"]`);

                        if (attributes.length > 0) {
                            return `${tag}${attributes.join('')}`;
                        }

                        // Last resort: use position but with full path
                        const getElementPath = (element) => {
                            if (!element || element === document.body) return '';
                            const index = Array.from(element.parentElement?.children || [])
                                .filter(child => child.tagName === element.tagName)
                                .indexOf(element) + 1;
                            const pathPart = `${element.tagName.toLowerCase()}:nth-of-type(${index})`;
                            const parentPath = getElementPath(element.parentElement);
                            return parentPath ? `${parentPath} > ${pathPart}` : pathPart;
                        };

                        return getElementPath(el);
                    }

                    return `${el.tagName.toLowerCase()}`;
                };

                return selectors.flatMap(selector => {
                    return Array.from(document.querySelectorAll(selector)).map((el, index) => ({
                        selector: generateReliableSelector(el),
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

    async discoverFeatures(page) {
        const features = [];

        try {
            console.log(chalk.blue('🎯 Discovering application features...'));

            const featureData = await page.evaluate(() => {
                const features = [];

                // Authentication features
                const authElements = document.querySelectorAll('[type="password"], input[name*="login"], input[name*="email"], .login, .sign-in, .auth');
                if (authElements.length > 0) {
                    features.push({
                        category: 'Authentication',
                        name: 'User Login/Registration',
                        priority: 'high',
                        elements: authElements.length,
                        selectors: Array.from(authElements).map(el => el.className || el.id || el.name).filter(Boolean),
                        testScenarios: ['login_valid', 'login_invalid', 'logout', 'password_reset']
                    });
                }

                // Navigation features
                const navElements = document.querySelectorAll('nav a, .navbar a, .menu a, .navigation a');
                if (navElements.length > 0) {
                    features.push({
                        category: 'Navigation',
                        name: 'Site Navigation',
                        priority: 'high',
                        elements: navElements.length,
                        selectors: Array.from(navElements).map(el => el.href).filter(Boolean),
                        testScenarios: ['navigation_flow', 'breadcrumb_navigation', 'menu_accessibility']
                    });
                }

                // Form submission features
                const forms = document.querySelectorAll('form');
                forms.forEach((form, index) => {
                    const inputs = form.querySelectorAll('input, textarea, select');
                    if (inputs.length > 0) {
                        const formType = form.action.includes('contact') ? 'Contact Form' :
                                       form.action.includes('search') ? 'Search Form' :
                                       form.action.includes('checkout') ? 'Checkout Form' :
                                       `Form ${index + 1}`;

                        features.push({
                            category: 'Forms',
                            name: formType,
                            priority: 'medium',
                            elements: inputs.length,
                            selectors: [form.id || form.className || `form:nth-of-type(${index + 1})`],
                            testScenarios: ['form_validation', 'form_submission', 'required_fields', 'error_handling']
                        });
                    }
                });

                // E-commerce features
                const ecommerceElements = document.querySelectorAll('.cart, .checkout, .add-to-cart, .buy-now, .product, .price');
                if (ecommerceElements.length > 0) {
                    features.push({
                        category: 'E-commerce',
                        name: 'Shopping Cart & Checkout',
                        priority: 'high',
                        elements: ecommerceElements.length,
                        selectors: Array.from(ecommerceElements).map(el => el.className).filter(Boolean),
                        testScenarios: ['add_to_cart', 'checkout_process', 'payment_validation', 'order_confirmation']
                    });
                }

                // Search features
                const searchElements = document.querySelectorAll('[type="search"], input[name*="search"], .search-input, .search-form');
                if (searchElements.length > 0) {
                    features.push({
                        category: 'Search',
                        name: 'Search Functionality',
                        priority: 'medium',
                        elements: searchElements.length,
                        selectors: Array.from(searchElements).map(el => el.name || el.className).filter(Boolean),
                        testScenarios: ['search_valid_query', 'search_invalid_query', 'search_filters', 'search_results']
                    });
                }

                // File upload features
                const uploadElements = document.querySelectorAll('[type="file"], .file-upload, .upload-area');
                if (uploadElements.length > 0) {
                    features.push({
                        category: 'File Management',
                        name: 'File Upload',
                        priority: 'medium',
                        elements: uploadElements.length,
                        selectors: Array.from(uploadElements).map(el => el.name || el.className).filter(Boolean),
                        testScenarios: ['file_upload_valid', 'file_upload_invalid', 'file_size_validation', 'file_type_validation']
                    });
                }

                // Dashboard/Admin features
                const dashboardElements = document.querySelectorAll('.dashboard, .admin, .panel, .sidebar, .widget');
                if (dashboardElements.length > 2) {
                    features.push({
                        category: 'Dashboard',
                        name: 'Dashboard Interface',
                        priority: 'medium',
                        elements: dashboardElements.length,
                        selectors: Array.from(dashboardElements).map(el => el.className).filter(Boolean),
                        testScenarios: ['dashboard_load', 'widget_interaction', 'data_display', 'responsive_layout']
                    });
                }

                // API interaction features (detect AJAX/Fetch calls)
                const ajaxIndicators = document.querySelectorAll('.loading, .spinner, [data-api], .async-content');
                if (ajaxIndicators.length > 0) {
                    features.push({
                        category: 'API Integration',
                        name: 'Dynamic Content Loading',
                        priority: 'medium',
                        elements: ajaxIndicators.length,
                        selectors: Array.from(ajaxIndicators).map(el => el.className).filter(Boolean),
                        testScenarios: ['api_load_success', 'api_load_failure', 'loading_states', 'error_recovery']
                    });
                }

                return features;
            });

            featureData.forEach(feature => {
                features.push({
                    ...feature,
                    pageUrl: page.url(),
                    discoveredAt: new Date(),
                    lastUpdated: new Date()
                });
            });

            console.log(chalk.green(`✅ Discovered ${features.length} application features`));

        } catch (error) {
            console.warn(chalk.yellow('⚠️ Feature discovery partial failure:'), error.message);
        }

        return features;
    }

    async generateTestingScope(coverage) {
        console.log(chalk.blue('📋 Generating testing scope...'));

        const scope = {
            generatedAt: new Date(),
            totalFeatures: coverage.features.length,
            highPriorityFeatures: coverage.features.filter(f => f.priority === 'high').length,
            mediumPriorityFeatures: coverage.features.filter(f => f.priority === 'medium').length,
            testScenarios: [],
            coverageAreas: {},
            recommendations: []
        };

        // Extract all unique test scenarios
        const allScenarios = new Set();
        coverage.features.forEach(feature => {
            feature.testScenarios.forEach(scenario => {
                allScenarios.add(`${feature.category}:${scenario}`);
            });
        });

        scope.testScenarios = Array.from(allScenarios);

        // Generate coverage areas
        const categories = [...new Set(coverage.features.map(f => f.category))];
        categories.forEach(category => {
            const categoryFeatures = coverage.features.filter(f => f.category === category);
            scope.coverageAreas[category] = {
                featureCount: categoryFeatures.length,
                totalElements: categoryFeatures.reduce((sum, f) => sum + f.elements, 0),
                priority: categoryFeatures.some(f => f.priority === 'high') ? 'high' : 'medium',
                scenarios: categoryFeatures.flatMap(f => f.testScenarios)
            };
        });

        // Generate testing recommendations
        if (coverage.features.length === 0) {
            scope.recommendations.push('No features detected - check if application is loading correctly');
        } else {
            scope.recommendations.push(`Focus on ${scope.highPriorityFeatures} high-priority features first`);

            if (coverage.errors.length > 0) {
                scope.recommendations.push(`Address ${coverage.errors.length} console errors before testing`);
            }

            if (coverage.forms.length > 0) {
                scope.recommendations.push(`Test ${coverage.forms.length} forms for validation and submission`);
            }

            if (coverage.apis.length > 0) {
                scope.recommendations.push(`Monitor ${coverage.apis.length} API endpoints for performance`);
            }
        }

        console.log(chalk.green(`✅ Testing scope generated: ${scope.testScenarios.length} scenarios across ${categories.length} categories`));

        return scope;
    }

    async updateTestingScope(sessionId, newCoverage) {
        if (!this.db || !sessionId) {
            console.warn(chalk.yellow('⚠️ Cannot update testing scope - database not available'));
            return null;
        }

        try {
            console.log(chalk.blue('🔄 Updating testing scope...'));

            // Get previous coverage
            const previousCoverage = await this.db.query(`
                SELECT testing_scope FROM test_sessions WHERE id = $1
            `, [sessionId]);

            let updatedScope = newCoverage.testingScope;
            let changes = [];

            if (previousCoverage.rows.length > 0 && previousCoverage.rows[0].testing_scope) {
                const prevScope = previousCoverage.rows[0].testing_scope;

                // Compare features
                const prevFeatureCount = prevScope.totalFeatures || 0;
                const newFeatureCount = newCoverage.features.length;

                if (newFeatureCount > prevFeatureCount) {
                    changes.push(`Added ${newFeatureCount - prevFeatureCount} new features`);
                }

                // Compare scenarios
                const prevScenarios = new Set(prevScope.testScenarios || []);
                const newScenarios = new Set(newCoverage.testingScope.testScenarios);
                const addedScenarios = [...newScenarios].filter(s => !prevScenarios.has(s));

                if (addedScenarios.length > 0) {
                    changes.push(`Added ${addedScenarios.length} new test scenarios`);
                    updatedScope.newScenarios = addedScenarios;
                }

                updatedScope.changes = changes;
                updatedScope.lastUpdated = new Date();
            }

            // Update database
            await this.db.query(`
                UPDATE test_sessions
                SET testing_scope = $1, updated_at = NOW()
                WHERE id = $2
            `, [JSON.stringify(updatedScope), sessionId]);

            if (changes.length > 0) {
                console.log(chalk.green(`✅ Testing scope updated: ${changes.join(', ')}`));
            } else {
                console.log(chalk.blue('ℹ️ No changes in testing scope'));
            }

            return updatedScope;

        } catch (error) {
            console.error(chalk.red('❌ Failed to update testing scope:'), error);
            return null;
        }
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