export function tailwindPlugin(context, options) {
    return {
      name: 'tailwind-plugin',
      injectHtmlTags() {
        return {
          headTags: [
            {
              tagName: "link",
              attributes: {
                rel: "stylesheet",
                href: "https://cdn.jsdelivr.net/npm/tailwindcss/dist/preflight.min.css",
              },
            },
          ],
        };
      },
      configurePostCss(postcssOptions) {
        postcssOptions.plugins = [
        //   require('postcss-import'),
          require('tailwindcss'),
          require('autoprefixer'),
        ];
        return postcssOptions;
      },
    };
  }