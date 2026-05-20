import { remarkBracketLinks } from '../source.config';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';

const processor = unified().use(remarkParse).use(remarkBracketLinks).use(remarkStringify);

const testCases = [
    {
        input: 'Represents [[onAck]] and [[ConfigObject.sessionId]].',
        expected: [
            '(/docs/reference/client/messages#onack)',
            '(/docs/guides/config-schema#sessionid)',
            '`onAck`',
            '`ConfigObject.sessionId`'
        ]
    },
    {
        input: 'Please check [[`Message`]] for detail.',
        expected: [
            '(/docs/reference/client/messages)',
            '`Message`'
        ]
    },
    {
        input: 'See [Client] documentation.',
        expected: [
            '(/docs/reference/client/client)',
            'Client'
        ]
    },
    {
        input: 'An [[UnresolvedEntity]] defaults to code.',
        expected: [
            '`UnresolvedEntity`'
        ]
    }
];

let failed = false;

for (const [idx, tc] of testCases.entries()) {
    const output = processor.processSync(tc.input).toString();
    console.log(`Test Case ${idx + 1} Input:`, tc.input);
    console.log(`Test Case ${idx + 1} Output:`, output);
    
    const missing = tc.expected.filter(str => !output.includes(str));
    if (missing.length > 0) {
        console.error(`❌ Test Case ${idx + 1} FAILED! Missing substrings:`, missing);
        failed = true;
    } else {
        console.log(`✅ Test Case ${idx + 1} PASSED`);
    }
    console.log('---');
}

if (failed) {
    console.error('Remark plugin tests failed!');
    process.exit(1);
} else {
    console.log('All Remark plugin tests passed successfully!');
}
