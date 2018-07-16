import { ImageBase64 } from './image-base64';
import { ElementStyle } from './element-style';
import { ElementInterface, ElementInputsInterface, ComponentStyleInterface } from './element-observable.model';
import { of, BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
const elementStyle = new ElementStyle();
export class Iwe7HtmlElement extends BehaviorSubject<any> {
    /**
     * 所有下级元素数组
     */
    childNodes: Iwe7HtmlElement[] = [];
    /**
     * 保存解析结果
     */
    json: ElementInterface;
    /**
     * 用来解析Hmtl成json的类
     * @param element 宿主元素
     * @param parent 上级
     */
    constructor(public element: Node, public parent?: Iwe7HtmlElement) {
        super({});
        // 下一个
        if (element) {
            const childNodes = element.childNodes
            const len = childNodes.length;
            for (let i = 0; i < len; i++) {
                const node = childNodes.item(i);
                if (node instanceof SVGElement) {
                    this.childNodes.push(new Iwe7HtmlElement(node, this));
                } else if (node instanceof HTMLElement) {
                    this.childNodes.push(new Iwe7HtmlElement(node, this));
                } else if (node instanceof Text) {
                    const text: Text = node;
                    const data = this.trim(text.data);
                    if (data !== '') {
                        this.childNodes.push(new Iwe7HtmlElement(node));
                    }
                }
            }
        }
    }
    /**
     * 初始化htmlToJson
     */
    private initHtmlJson() {
        const element = this.element;
        // 匹配已使用过的元素 并记录再按
        elementStyle.matchElement(element);
        this.json = {
            tagName: this.tagName(element),
            id: (<HTMLElement>this.element).id,
            nodeType: this.element.nodeType,
            children: [] as ElementInterface[],
            style: this.getNativeStyle(element),
            className: (<HTMLElement>this.element).className || "",
            inputs: {
                attrs: []
            } as ElementInputsInterface,
            cssSelector: "",
            outputs: {},
            methods: {}
        };
        if (this.json.tagName === 'body') this.json.id = "";
        this.json = this.handlerElement(element, this.json);
    }
    /**
     * 去除string中的开头结尾空格和换行
     * @param x 要处理掉额变量
     */
    private trim(x: string) {
        x = x.replace(/^\s+|\s+$/gm, '');
        x = x.replace(/[\n\t]/gm, '');
        return x;
    }
    /**
     * 解析css样式
     */
    parseCss2() {
        let str = '';
        elementStyle.usedStyle.forEach((used, key) => {
            str += used;
        });
        return str;
    }
    /**
     * 解析html结构
     */
    parse(): Observable<any> {
        return elementStyle.inited.pipe(
            switchMap(res => {
                this.initHtmlJson();
                const ress = [];
                this.childNodes.map(child => {
                    ress.push(child.parse())
                });
                if (ress.length > 0) {
                    return combineLatest(ress).pipe(
                        map(res => {
                            this.json.children = res;
                            for (let key = 0; key < res.length; key++) {
                                if (['style', 'script', 'head'].indexOf(res[key].tagName) > -1) {
                                    delete this.json.children[key];
                                }
                            }
                            this.json.children = { ...this.json.children };
                            this.complete();
                            return this.json;
                        })
                    );
                } else {
                    return of(this.json);
                }
            })
        );
    }
    /**
     * 获取宿主元素style样式
     * @param ele 宿主元素 Node
     */
    private getNativeStyle(ele: Node): { [key: string]: string } {
        if (ele.nodeType === 1) {
            const inlineStyle = (<any>ele).style;
            const result = {};
            for (let key = 0; key < inlineStyle.length; key++) {
                const name = inlineStyle.item(key);
                const property = this.camelCase(name);
                result[property] = inlineStyle[property];
            }
            return result;
        }
        return {};
    }
    /**
     * 获取宿主元素tagName
     * @param ele 宿主元素
     */
    private tagName(ele: Node): string {
        if (ele instanceof HTMLElement) {
            return ele.tagName.toLocaleLowerCase();
        } else if (ele instanceof SVGElement) {
            return ele.tagName;
        } else {
            return '';
        }
    }
    /**
     * 将下划线转换成驼峰式
     * @param string 变量名
     */
    private camelCase(string: string): string {
        return string.replace(/-([a-z])/g, (all, letter) => {
            return letter.toUpperCase();
        });
    }
    /**
     * 解析html结构
     * @param ele 宿主元素
     * @param obj 结果
     */
    private handlerElement(ele: Node, obj: ElementInterface): ElementInterface {
        if (ele instanceof HTMLAnchorElement) {
            obj.inputs.href = ele.href;
        }
        else if (ele instanceof HTMLAreaElement) {
        }
        else if (ele instanceof HTMLAudioElement) {
            obj.inputs.autoplay = ele.autoplay;
            obj.inputs.src = ele.src;
            obj.inputs.autoplay = ele.autoplay;
            obj.inputs.controls = ele.controls;
            obj.inputs.currentTime = ele.currentTime;
            obj.inputs.loop = ele.loop;
        }
        else if (ele instanceof HTMLBaseElement) {
            obj.inputs.href = ele.href;
            obj.inputs.target = ele.target;
        }
        else if (ele instanceof HTMLQuoteElement) {
        }
        else if (ele instanceof HTMLBodyElement) {
        }
        else if (ele instanceof HTMLBRElement) {
        }
        else if (ele instanceof HTMLButtonElement) {
            obj.inputs.type = ele.type;
            obj.inputs.value = ele.value;
            obj.inputs.name = ele.name;
            obj.inputs.autofocus = ele.autofocus;
            obj.inputs.disabled = ele.disabled;
        }
        else if (ele instanceof HTMLCanvasElement) {
        }
        else if (ele instanceof HTMLTableCaptionElement) {
        }
        else if (ele instanceof HTMLTableColElement) {
        }
        else if (ele instanceof HTMLDataElement) {
        }
        else if (ele instanceof HTMLDataListElement) {
        }
        else if (ele instanceof HTMLModElement) {
        }
        else if (ele instanceof HTMLDirectoryElement) {
        }
        else if (ele instanceof HTMLDivElement) {
            obj.inputs.align = ele.align;
            obj.inputs.noWrap = ele.noWrap;
        }
        else if (ele instanceof HTMLDListElement) {
        }
        else if (ele instanceof HTMLEmbedElement) {
        }
        else if (ele instanceof HTMLFieldSetElement) {
        }
        else if (ele instanceof HTMLFontElement) {
        }
        else if (ele instanceof HTMLFormElement) {
        }
        else if (ele instanceof HTMLFrameElement) {
        }
        else if (ele instanceof HTMLFrameSetElement) {
        }
        else if (ele instanceof HTMLHeadingElement) {
        }
        else if (ele instanceof HTMLHeadElement) {
        }
        else if (ele instanceof HTMLHRElement) {
        }
        else if (ele instanceof HTMLHtmlElement) {
        }
        else if (ele instanceof HTMLIFrameElement) {
            obj.inputs.allowFullscreen = ele.allowFullscreen
            obj.inputs.allowPaymentRequest = ele.allowPaymentRequest
            obj.inputs.frameBorder = ele.frameBorder
            obj.inputs.marginHeight = ele.marginHeight
            obj.inputs.marginWidth = ele.marginWidth
            obj.inputs.scrolling = ele.scrolling
            obj.inputs.srcdoc = ele.srcdoc
            obj.inputs.src = ele.src
        }
        else if (ele instanceof HTMLImageElement) {
            obj.inputs.src = ele.src;
            obj.inputs.border = ele.border;
            obj.inputs.crossOrigin = ele.crossOrigin;
            obj.inputs.hspace = ele.hspace;
            obj.inputs.isMap = ele.isMap;
            obj.inputs.longDesc = ele.longDesc;
            obj.inputs.lowsrc = ele.lowsrc;
            obj.inputs.msPlayToDisabled = ele.msPlayToDisabled
            obj.inputs.msPlayToPreferredSourceUri = ele.msPlayToPreferredSourceUri
            obj.inputs.msPlayToPrimary = ele.msPlayToPrimary
            obj.inputs.sizes = ele.sizes
            obj.inputs.srcset = ele.srcset
            obj.inputs.vspace = ele.vspace;
            obj.inputs.width = ele.width;
            obj.inputs.height = ele.height;
        }
        else if (ele instanceof HTMLInputElement) {
            obj.inputs.align = ele.align;
            obj.inputs.alt = ele.alt;
            obj.inputs.autocomplete = ele.autocomplete;
            obj.inputs.checked = ele.checked;
            obj.inputs.defaultChecked = ele.defaultChecked;
            obj.inputs.files = ele.files;
            obj.inputs.formAction = ele.formAction;
            obj.inputs.formEnctype = ele.formEnctype;
            obj.inputs.formMethod = ele.formMethod;
            obj.inputs.formTarget = ele.formTarget;
            obj.inputs.indeterminate = ele.indeterminate;
            obj.inputs.min = ele.min;
            obj.inputs.pattern = ele.pattern;
            obj.inputs.selectionDirection = ele.selectionDirection;
            obj.inputs.step = ele.step;
            obj.inputs.useMap = ele.useMap;
            obj.inputs.value = ele.value;
            obj.inputs.valueAsDate = ele.valueAsDate;
            obj.inputs.valueAsNumber = ele.valueAsNumber;
            obj.inputs.webkitdirectory = ele.webkitdirectory;
        }
        else if (ele instanceof HTMLModElement) {
        }
        else if (ele instanceof HTMLUnknownElement) {
        }
        else if (ele instanceof HTMLLabelElement) {
            obj.inputs.htmlFor = ele.htmlFor;
        }
        else if (ele instanceof HTMLLegendElement) {
        }
        else if (ele instanceof HTMLLIElement) {
        }
        else if (ele instanceof HTMLLinkElement) {
        }
        else if (ele instanceof HTMLPreElement) {
        }
        else if (ele instanceof HTMLMapElement) {
        }
        else if (ele instanceof HTMLMarqueeElement) {
        }
        else if (ele instanceof HTMLMenuElement) {
            obj.inputs.compact = ele.compact;
            obj.inputs.type = ele.type;
        }
        else if (ele instanceof HTMLMetaElement) {
        }
        else if (ele instanceof HTMLMeterElement) {
        }
        else if (ele instanceof HTMLUnknownElement) {
        }
        else if (ele instanceof HTMLObjectElement) {
        }
        else if (ele instanceof HTMLOListElement) {
            obj.inputs.compact = ele.compact;
            obj.inputs.start = ele.start;
            obj.inputs.type = ele.type;
        }
        else if (ele instanceof HTMLOptGroupElement) {
        }
        else if (ele instanceof HTMLOptionElement) {
            obj.inputs.defaultSelected = ele.defaultSelected;
            obj.inputs.disabled = ele.disabled;
            obj.inputs.label = ele.label;
            obj.inputs.selected = ele.selected;
            obj.inputs.text = ele.text;
            obj.inputs.value = ele.value;
        }
        else if (ele instanceof HTMLOutputElement) {
            obj.inputs.name = ele.name;
            obj.inputs.value = ele.value;
            obj.inputs.defaultValue = ele.defaultValue;
        }
        else if (ele instanceof HTMLParagraphElement) {
        }
        else if (ele instanceof HTMLParamElement) {
        }
        else if (ele instanceof HTMLPictureElement) {
        }
        else if (ele instanceof HTMLPreElement) {
        }
        else if (ele instanceof HTMLProgressElement) {
            obj.inputs.max = ele.max;
            obj.inputs.value = ele.value;
        }
        else if (ele instanceof HTMLQuoteElement) {
        }
        else if (ele instanceof HTMLScriptElement) {
        }
        else if (ele instanceof HTMLSelectElement) {
            obj.inputs.value = ele.value;
            obj.inputs.disabled = ele.disabled;
            obj.inputs.name = ele.name;
            obj.inputs.length = ele.length;
            obj.inputs.multiple = ele.multiple;
            obj.inputs.required = ele.required;
            obj.inputs.selectedIndex = ele.selectedIndex;
            obj.inputs.size = ele.size;
        }
        else if (ele instanceof HTMLSourceElement) {
        }
        else if (ele instanceof HTMLSpanElement) {
        }
        else if (ele instanceof HTMLStyleElement) {
            obj.inputs.media = ele.media;
            obj.inputs.disabled = ele.disabled;
            obj.inputs.type = ele.type;
        }
        else if (ele instanceof HTMLTableElement) {
        }
        else if (ele instanceof HTMLTableSectionElement) {
        }
        else if (ele instanceof HTMLTemplateElement) {
        }
        else if (ele instanceof HTMLTextAreaElement) {
            obj.inputs.value = ele.value;
            obj.inputs.cols = ele.cols;
            obj.inputs.defaultValue = ele.defaultValue;
            obj.inputs.maxLength = ele.maxLength;
            obj.inputs.minLength = ele.minLength;
            obj.inputs.placeholder = ele.placeholder;
            obj.inputs.readOnly = ele.readOnly;
            obj.inputs.selectionEnd = ele.selectionEnd;
            obj.inputs.selectionStart = ele.selectionStart;
            obj.inputs.wrap = ele.wrap;
        }
        else if (ele instanceof HTMLTableSectionElement) {
        }
        else if (ele instanceof HTMLTableSectionElement) {
        }
        else if (ele instanceof HTMLTimeElement) {
            obj.inputs.dateTime = ele.dateTime;
        }
        else if (ele instanceof HTMLTitleElement) {
            obj.inputs.text = ele.text;
        }
        else if (ele instanceof HTMLTableRowElement) {
        }
        else if (ele instanceof HTMLTrackElement) {
        }
        else if (ele instanceof HTMLUListElement) {
        }
        else if (ele instanceof HTMLVideoElement) {
            obj.inputs.poster = ele.poster;
            obj.inputs.width = ele.width;
            obj.inputs.height = ele.height;
        }
        else if (ele instanceof HTMLPreElement) {
            obj.inputs.width = ele.width;
        } else if (ele instanceof Text) {
            obj.inputs.data = ele.data;
        }
        if (ele instanceof SVGElement) {
            obj.className = ele.className.animVal;
            const attris: NamedNodeMap = ele.attributes;
            for (let key = 0; key < attris.length; key++) {
                const attr: Attr = attris.item(key);
                obj.inputs.attrs.push({
                    name: attr.name,
                    value: attr.value
                });
            }
        }
        return obj;
    }
}
