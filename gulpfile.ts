import { src, dest, series } from 'gulp';
import del from 'del';
import through2 from 'through2';
import log from 'fancy-log';
import * as File from 'vinyl';
import solc from '@theorderbookdex/solidity-compiler';
import { abi2ts } from '@theorderbookdex/abi2ts';
import { spawn } from 'child_process';
import { readdirSync, writeFileSync } from 'fs';
import { resolve, relative } from 'path';

export async function clean() {
    await del([ 'artifacts/**', 'src/**', '!src/tsconfig.json', 'dist/**' ]);
}

export function compileContracts() {
    return src('contracts/**/*.sol')
        .pipe(through2.obj(function(file: File, _, callback) {
            file.contents = Buffer.from(JSON.stringify(solc(file.base, file.relative, file.contents as Buffer, { optimizer: { enabled: true } }), null, 2));
            log(`>>> Compiled contracts/${file.relative}`);
            file.extname = '.json';
            callback(null, file);
        }))
        .pipe(dest('artifacts'));
}

export function createContractsTS() {
    return src([ 'artifacts/**/*.json' ])
        .pipe(through2.obj(function(file: File, _, callback) {
            file.contents = abi2ts(file.contents as Buffer);
            file.extname = '.ts';
            log(`>>> Created src/${file.relative}`);
            callback(null, file);
        }))
        .pipe(dest('src'));
}

export function createIndexTS(done: () => void) {
    function _createIndexTS(path: string) {
        const exports = [];
        for (const file of readdirSync(path, { withFileTypes: true })) {
            if (file.isDirectory()) {
                _createIndexTS(resolve(path, file.name));
                exports.push(`export * as ${file.name} from './${file.name}/index';`);
            } else if (file.name == 'index.ts') {
                continue;
            } else if (file.name.endsWith('.ts')) {
                const name = file.name.slice(0, -3);
                exports.push(`export * as ${name} from './${name}';`);
            }
        }
        const filepath = resolve(path, 'index.ts');
        writeFileSync(filepath, exports.join('\n'));
        log(`>>> Created ${relative(__dirname, filepath)}`);
    }
    _createIndexTS(resolve(__dirname, 'src'));
    done();
}

export function compileContractsTS() {
    return spawn('npx tsc -p src', { shell: true, stdio: 'inherit' });
}

export default function(done: () => void) {
    series(clean, compileContracts, createContractsTS, createIndexTS, compileContractsTS)(done);
}
