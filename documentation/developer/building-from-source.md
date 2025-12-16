# Building from source

To build the production version of evitaLab, follow the steps below:

Before you start, make sure you have [Node.js](https://nodejs.org/en/) installed in the version specified in `.nvmrc` and [Yarn](https://yarnpkg.com/)
package manager installed.

Then you can build either the standalone mode:

```shell
yarn install
yarn build
```

Or the driver mode (for [evitaLab Desktop](https://github.com/FgForrest/evitalab-desktop)):

```shell
yarn install
yarn build-driver
```