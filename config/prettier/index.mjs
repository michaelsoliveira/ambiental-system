/** @typedef { import('prettier').Config } PrettierConfig */

/** @type { PrettierConfig } */

const config = {
    plugins: [import('prettier-plugin-tailwindcss')],
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    quoteProps: 'as-needed',
    bracketSpacing: true,
    arrowParens: 'always',
    endOfLine: 'lf',
}

export default {
    ...config,
    // tailwindConfig: './tailwind.config.cjs',
    semi: true,
    singleQuote: true,
    printWidth: 80,
    tabWidth: 2,
    trailingComma: 'es5',
    arrowParens: 'always',
    endOfLine: 'lf',
}