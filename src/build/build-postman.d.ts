export declare const generatePostmanJson: (setup?: any) => Promise<{
    info: {
        _postman_id: string;
        name: string;
        description: string;
        schema: string;
    };
    item: any;
    event: {
        listen: string;
        script: {
            id: string;
            type: string;
            exec: string[];
        };
    }[];
    variable: {
        id: string;
        key: string;
        value: string;
    }[];
    protocolProfileBehavior: {};
}>;
