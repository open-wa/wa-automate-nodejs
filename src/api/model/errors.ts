export class PageEvaluationTimeout extends Error {
    constructor(...args) {
        super(...args);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PageEvaluationTimeout);
        }
        this.name = 'PageEvaluationTimeout';
        this.message =
            'The method call was timed out but it may have been successfull in the WA session. It is just no longer holding up the process';
    }
}
