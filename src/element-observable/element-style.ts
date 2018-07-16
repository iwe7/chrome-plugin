import { ComponentStyleInterface } from './element-observable.model';
import { Iwe7StyleLoader } from './style-loader';
import sortBy from 'lodash.sortby';
import merge from 'lodash.merge';
import { BehaviorSubject } from 'rxjs';
const iwe7StyleLoader: Iwe7StyleLoader = new Iwe7StyleLoader();
// 这个肯定是可以的吧
const usedStyleMap: Map<CSSStyleRule, string> = new Map();

export class ElementStyle {
    /**
     * 保存已经使用的的样式规则
     **/
    get usedStyle() {
        return usedStyleMap;
    }
    private styleSheets: StyleSheetList;
    private map: Map<string, { [key: string]: { [key: string]: any } }> = new Map();
    private levelMap: Map<string, { level: number, item: any }> = new Map();
    inited: BehaviorSubject<boolean> = new BehaviorSubject(false);
    // 选择器
    private selectorMap: Map<string, Map<CSSStyleRule, CSSStyleRule>> = new Map();
    // 格式化后的选择器
    private selectorFormatMap: Map<string, Map<CSSStyleRule, CSSStyleRule>> = new Map();
    /**
     * 样式解析器
     */
    constructor() {
        iwe7StyleLoader.getStyleFromUrl().subscribe(res => {
            this.handlerRule();
            this.inited.next(true);
        });
    }
    /**
     * 匹配元素样式规则
     */
    matchElement(div: Node): void {
        if (div.nodeType === 1) {
            if (div.nodeType === 1) {
                // 匹配类似:after等样式
                this.selectorFormatMap.forEach((items: Map<CSSStyleRule, CSSStyleRule>, key: string) => {
                    try {
                        if ((<any>div).matches(key)) {
                            items.forEach((item: CSSStyleRule) => {
                                let cssStyleRules = this.selectorMap.get(item.selectorText);
                                cssStyleRules.forEach((rule: CSSStyleRule) => {
                                    usedStyleMap.set(rule, rule.cssText);
                                })
                            })
                        }
                    } catch (error) { }
                });
                // 匹配样式
                this.levelMap.forEach((item, key) => {
                    try {
                        const tagName = (<HTMLElement>div).tagName.toLocaleLowerCase();
                        let base = 0;
                        if (tagName === 'body') {
                            base = -1000;
                        }
                        if ((<any>div).matches(key)) {
                            let cssRules = this.selectorMap.get(key);
                            cssRules.forEach(rule => {
                                usedStyleMap.set(rule, rule.cssText);
                            })
                        }
                    } catch (err) { }
                });
            }
        }
    }
    private handlerRule() {
        this.styleSheets = window.document.styleSheets;
        const len = this.styleSheets.length;
        const rules: CSSRule[] = [];
        for (let i = 0; i < len; i++) {
            let styleSheet = this.styleSheets.item(i) as CSSStyleSheet;
            if (styleSheet instanceof CSSStyleSheet) {
                if (!styleSheet.href) {
                    if (this.matchMedia(styleSheet.media.mediaText)) { }
                    const ruleList: CSSRuleList = styleSheet['cssRules'] || styleSheet['rules'];
                    const len = ruleList.length;
                    for (let key = 0; key < len; key++) {
                        const cssRule: CSSRule = ruleList.item(key);
                        if (cssRule instanceof CSSStyleRule) {
                            // 计算优先级
                            this.forEachStyle(cssRule);
                            this.getLevel();
                        }
                    }
                }
            }
        }
        return rules;
    }
    private matchMedia(mediaText): boolean {
        return matchMedia(mediaText).matches;
    }
    private getLevel(): void {
        this.map.forEach((item, selector) => {
            const backselector = selector;
            const selectors = selector.split(',');
            selector = selectors[selectors.length - 1];
            const charts = selector.split('');
            let level = [0, 0, 0, 0];
            // 判断是否#结尾
            charts.map(res => {
                if (res === '#') {
                    level[1] += 1;
                }
                if (res === '[') {
                    level[2] += 1;
                }
                if (res === '.') {
                    level[2] += 1;
                }
            });
            selector = selector.replace(/\#.*?[\s\,]/g, '');
            selector = selector.replace(/\[.*?\].*?[\s\,]/g, '');
            selector = selector.replace(/\..*?[\s\,]/g, '');
            const matchs = selector.split(' ');
            level[3] = matchs.length;
            // #ul li  .ul .li
            const total = level[0] * 100000 + level[1] * 1000 + level[2] * 100 + level[3] * 1;
            this.levelMap.set(backselector, {
                level: total,
                item: item
            });
        });
    }

    private parseSelector(selector: string): string[] {
        const selectors = selector.split(',');
        const res: string[] = [];
        for (let selectorsKey in selectors) {
            const selects = selectors[selectorsKey].split(' ');
            for (let selectsKey in selects) {
                const select = selects[selectsKey];
                if (/[a-z]+\:/.test(select)) {
                    const pses = select.split(/[a-z]+\:/);
                    res.push(pses[pses.length - 1]);
                }
            }
        }
        return res;
    }

    private trim(x: string) {
        return x.replace(/^\s+|\s+$/gm, '');
    }

    private findParse(css: CSSStyleRule) {
        const psess = this.parseSelector(css.selectorText);
        let selector: string = css.selectorText
        // 存在:
        if (psess.length) {
            psess.map(ps => {
                const reg = new RegExp(':+' + ps, 'i');
                // 处理后的selector
                selector = selector.replace(reg, '');
                let rules = this.selectorFormatMap.get(selector);
                rules = rules || new Map();
                rules.set(css, css);
                this.selectorFormatMap.set(selector, rules);
            });
        }
    }

    private forEachStyle(css: CSSStyleRule): void {
        const psess = this.parseSelector(css.selectorText);
        this.findParse(css);
        const len = css.style.length;
        let selector: string = css.selectorText
        let rules = this.selectorMap.get(selector);
        rules = rules || new Map();
        rules.set(css, css);
        this.selectorMap.set(selector, rules);
        const map: { [key: string]: string } = {};
        if (psess.length) {
            psess.map(ps => {
                const reg = new RegExp(':+' + ps, 'i');
                selector = selector.replace(reg, '');
                for (let i = 0; i < len; i++) {
                    const name = css.style.item(i);
                    map[name] = css.style.getPropertyValue(name);
                }
                // 判断是否存在
                if (this.map.has(selector)) {
                    let psMap = this.map.get(selector);
                    psMap = merge(psMap, {
                        [`${ps}`]: map
                    });
                    this.map.set(selector, psMap);
                } else {
                    this.map.set(selector, {
                        [`${ps}`]: map
                    });
                }
            });
        } else {
            for (let i = 0; i < len; i++) {
                const name = css.style.item(i);
                map[name] = css.style.getPropertyValue(name);
            };
            const ps = 'default';
            // 判断是否存在
            if (this.map.has(selector)) {
                let psMap = this.map.get(selector);
                psMap = merge(psMap, {
                    [`${ps}`]: map
                });
                this.map.set(selector, psMap);
            } else {
                this.map.set(selector, {
                    [`${ps}`]: map
                });
            }
        }
    }
}
