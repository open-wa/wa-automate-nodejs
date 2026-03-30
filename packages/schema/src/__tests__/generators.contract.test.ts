import fs from 'fs';
import path from 'path';
import { clientRegistry } from '../registry';
import '../methods';

const generatedDir = path.join(__dirname, '../generated');

describe('generator outputs', () => {
    describe('openapi.json', () => {
        const openapiPath = path.join(generatedDir, 'openapi.json');
        
        it('should exist', () => {
            expect(fs.existsSync(openapiPath)).toBe(true);
        });

        it('should be valid JSON', () => {
            const content = fs.readFileSync(openapiPath, 'utf-8');
            expect(() => JSON.parse(content)).not.toThrow();
        });

        it('should have paths for registered methods', () => {
            const content = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));
            const pathCount = Object.keys(content.paths || {}).length;
            const methodCount = clientRegistry.getAll().length;
            
            expect(pathCount).toBeGreaterThan(methodCount * 0.9);
        });

        it('should have valid OpenAPI structure', () => {
            const content = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));
            
            expect(content.openapi).toBe('3.0.0');
            expect(content.info).toBeDefined();
            expect(content.info.title).toBeTruthy();
            expect(content.paths).toBeDefined();
        });
    });

    describe('types.ts', () => {
        const typesPath = path.join(generatedDir, 'types.ts');
        
        it('should exist', () => {
            expect(fs.existsSync(typesPath)).toBe(true);
        });

        it('should have type exports for methods', () => {
            const content = fs.readFileSync(typesPath, 'utf-8');
            
            expect(content).toContain('SendTextInput');
            expect(content).toContain('SendTextOutput');
            expect(content).toContain('export type');
        });

        it.skip('should not have TypeScript errors', async () => {
            if (!process.env.TS_CHECK) {
                return;
            }
            
            const { exec } = require('child_process');
            const result = await new Promise((resolve) => {
                exec(`npx tsc --noEmit ${typesPath}`, (error: any, stdout: string) => {
                    resolve({ error, stdout });
                });
            });
            
            expect((result as any).error).toBeNull();
        });
    });

    describe('BaseClient.ts', () => {
        const baseClientPath = path.join(generatedDir, 'BaseClient.ts');
        const generatedIndexPath = path.join(generatedDir, 'index.ts');
        
        it('should exist', () => {
            expect(fs.existsSync(baseClientPath)).toBe(true);
        });

        it('should have method implementations', () => {
            const content = fs.readFileSync(baseClientPath, 'utf-8');
            
            expect(content).toContain('sendText = implementMethod');
            expect(content).toContain('public sendText');
        });

        it('should have at least expected method count', () => {
            const content = fs.readFileSync(baseClientPath, 'utf-8');
            const methodCount = clientRegistry.getAll().length;
            
            const matches = content.match(/implementMethod/g) || [];
            expect(matches.length).toBeGreaterThanOrEqual(methodCount);
        });

        it('should create a generated package index', () => {
            expect(fs.existsSync(generatedIndexPath)).toBe(true);
            const content = fs.readFileSync(generatedIndexPath, 'utf-8');
            expect(content).toContain("export * from './BaseClient'");
            expect(content).toContain("export * from './types'");
        });
    });
});
