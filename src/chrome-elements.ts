import { Iwe7HtmlElement } from './element-observable/element-observable';
import { tap, map, switchMap, take, debounceTime } from 'rxjs/operators';
import { Observable, fromEvent } from 'rxjs';
import { merge } from 'rxjs';
export default class ChromeElement {
    allElements: any[] = [];
    defaultStyle: CSSStyleDeclaration | null = null;
    defaultElement: any;
    get document() {
        return window.document;
    }
    hasDefault: boolean = false;
    iwe7HtmlElement: Iwe7HtmlElement;

    constructor() { }
    getAllElements(element: any): HTMLElement[] {
        let elements: HTMLElement[] = [];
        if (element && element.hasChildNodes()) {
            elements.push(element);
            const childs = element.childNodes;
            for (var i = 0; i < childs.length; i++) {
                if (childs[i].hasChildNodes()) {
                    elements = elements.concat(this.getAllElements(childs[i]));
                } else if (childs[i].nodeType == 1) {
                    elements.push(childs[i]);
                }
            }
        }
        return elements;
    }

    getIwe7Font(value: string) {
        if (value.indexOf('fzzzh')) {
            return 'fzzzh';
        }
        if (value.indexOf('iconfont')) {
            return 'iconfont';
        }
        if (value.indexOf('impact')) {
            return 'impact';
        }
    }

    selectElement: any;
    childrenSelectIndex: number = -1;
    selectClassName: string = '___iwe7_class_active';
    open: boolean = false;
    listener: any;
    listenerElement: any;

    closeElement() {
        if (this.listener) {
            this.listener.unsubscribe();
            this.listener = null;
        }
        if (this.listenerElement) {
            this.listenerElement.unsubscribe();
            this.listenerElement = null;
        }
        this.open = false;
    }
    openElement() {
        if (!this.open) {
            this.allElements = this.getAllElements(this.document);
            const elementListener: any[] = [];
            this.allElements.map(element => {
                elementListener.push(this.bindEvents(element))
            });
            this.listenerElement = merge(...elementListener).subscribe();
            const keydown = fromEvent(document, 'keydown');
            const keyup = fromEvent(document, 'keyup');
            this.listener = keydown.pipe(
                tap(res => this.stopEvent(res)),
                switchMap(res => keyup.pipe(
                    take(1),
                    map((res: any) => {
                        return {
                            keyCode: res.keyCode || res.which || res.charCode,
                            ctrlKey: res.ctrlKey || res.metaKey
                        }
                    }),
                    tap(res => {
                        const code = res.keyCode + '';
                        const ctrl = res.ctrlKey;
                        if (ctrl) {
                            switch (code) {
                                case '80': {
                                    const name = prompt('请输入选择器');
                                    const ele = document.getElementById(name)[0];
                                    // $(ele).setElement(ele);
                                    this.selectElement = ele;
                                    this.sendElement();
                                }
                                case '13': {
                                    break;
                                }
                                default: {
                                    break;
                                }
                            }
                        } else {
                            switch (code) {
                                case '32': {
                                    // space
                                    this.selectFather();
                                    break;
                                }
                                case '13': {
                                    // enter
                                    this.sendElement();
                                    break;
                                }
                                case '187': {
                                    // +
                                    this.fontElement();
                                }
                                default: {
                                    break;
                                }
                            }
                        }
                    })
                ))
            ).subscribe();
            this.open = true;
        }
    }
    fontElement() {
        let text = '';
        return text;
    }
    sendElement() {
        this.removeAllActive();
        this.iwe7HtmlElement = new Iwe7HtmlElement(this.selectElement);
        const listener = this.iwe7HtmlElement.parse().subscribe(res => {
            res.cssStr2 = this.iwe7HtmlElement.parseCss2();
            const action = {
                type: "WindowNewElementAction",
                payload: res
            };
            chrome.runtime.connect('chrome-element');
            chrome.runtime.sendMessage(action, (resp) => {
                console.log('finish');
            });
            if (listener) {
                listener.unsubscribe();
            }
        });
    }

    activeSelectElement() {
        if (this.selectElement) {
            this.removeAllActive();
            if (['svg', 'use'].indexOf((<string>this.selectElement.tagName).toLocaleLowerCase()) > -1) {
            } else {
                this.selectElement.className = `${this.selectClassName} ${this.selectElement.className || ''}`;
            }
        }
    }

    selectFather() {
        if (this.selectElement instanceof HTMLElement) {
            const parent = (<HTMLElement>this.selectElement).parentElement;
            if (parent) {
                this.selectElement = parent;
                console.log(this.selectElement.tagName + '.' + this.selectElement.className);
                if (this.selectElement.tagName === 'BODY') {
                    this.activeSelectElement();
                    this.sendElement();
                } else {
                    this.activeSelectElement();
                }
            }
        }
    }

    bindEvents(ele: HTMLElement): Observable<any> {
        const touchstart = fromEvent(ele, 'touchstart');
        const touchmove = fromEvent(ele, 'touchmove');
        const touchend = fromEvent(ele, 'touchend');
        const touchcancel = fromEvent(ele, 'touchcancel');

        const mouseover = fromEvent(ele, 'mouseover');
        const mouseout = fromEvent(ele, 'mouseout');
        const mousemove = fromEvent(ele, 'mousemove');

        const mousedown = fromEvent(ele, 'touchstart');

        const click = fromEvent(ele, 'click');

        const moseup = fromEvent(ele, 'touchstart');
        const keyup = fromEvent(ele, 'keyup');
        return merge(
            touchstart,
            click
        ).pipe(
            tap(res => this.stopEvent(res)),
            debounceTime(300),
            tap((res: Event) => {
                const target = res.target as HTMLElement;
                // 设置激活元素
                this.selectElement = target;
                // 激活元素
                this.activeSelectElement();
            })
        );
    }

    stopEvent(res: Event) {
        if (res.cancelable) {
            if (!res.defaultPrevented) {
                res.preventDefault();
            }
            res.stopPropagation();
        }
    }

    removeAllActive() {
        const elements = document.getElementsByClassName(this.selectClassName);
        for (let i = 0; i < elements.length; i++) {
            elements.item(i).classList.remove(this.selectClassName);
        }
    }
}

const iwe7_chrome_element = new ChromeElement();
(<any>window).__iwe7Element = iwe7_chrome_element;
