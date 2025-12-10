export declare class ScriptLoader {
    scripts: string[];
    contentRegistry: {
        [key: string]: string;
    };
    constructor();
    loadScripts(): Promise<{
        [key: string]: string;
    }>;
    getScript(scriptName: string): Promise<string>;
    flush(): void;
    getScripts(): {
        [key: string]: string;
    };
}
declare const scriptLoader: ScriptLoader;
export { scriptLoader };
//# sourceMappingURL=script_preloader.d.ts.map