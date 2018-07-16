import { Observable, of, forkJoin } from "rxjs";
import { tap } from "rxjs/operators";

export class Iwe7StyleLoader {
    // 获取远程
    hasCheckStyle: boolean = false;
    getStyleFromUrl(): Observable<any> {
        const sheets: StyleSheetList = window.document.styleSheets;
        const obsers = [];
        for (let i = 0; i < sheets.length; i++) {
            if (sheets[i].href) {
                obsers.push(
                    Observable.create(ob => {
                        this.iterLink(sheets[i] as CSSStyleSheet, () => {
                            ob.next();
                            ob.complete();
                        })
                    })
                )
            }
        }
        if (this.hasCheckStyle) {
            return of(true);
        } else {
            if (obsers.length > 0) {
                return forkJoin(...obsers).pipe(
                    tap(res => this.hasCheckStyle = true)
                );
            } else {
                return of(true);
            }
        }
    }

    constructor() { }
    // 加载css
    private iterLink(sheet: CSSStyleSheet, func) {
        if (!sheet) {
            return
        }
        const that = this;
        if (sheet.href) {
            var g = new XMLHttpRequest
            g.open('GET', sheet.href)
            g.onreadystatechange = function () {
                if (this.readyState == this.DONE) {
                    const style = document.createElement('style');
                    style.type = 'text/css';
                    style.innerHTML = this.responseText;
                    const styleElement = document.getElementsByTagName('style')[0];
                    document.head.insertBefore(style, styleElement);
                    func && func();
                }
            }
            g.send()
        }
    }
}
