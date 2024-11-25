import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [{
    input: 'js/content.js',
    output: {
        file: 'content-built.js',
        format: 'iife'
    },
    plugins: [json(), nodeResolve()]
},
{
    input: 'js/background.js',
    output: {
        file: 'background-built.js',
        format: 'iife'
    },
    plugins: [json(), nodeResolve()]
},
{
    input: 'js/side-panel.js',
    output: {
        file: 'side-panel-built.js',
        format: 'iife'
    },
    plugins: [json(), nodeResolve()]
},
{
    input: 'js/options.js',
    output: {
        file: 'options-built.js',
        format: 'iife'
    },
    plugins: [json(), nodeResolve()]
}];