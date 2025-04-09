<h1 align="center" style="border-bottom: none">
    <a href="https://evitadb.io" target="_blank"><img src="https://raw.githubusercontent.com/lukashornych/evitalab/dev/documentation/user/assets/img/evitalab.svg"/></a><br>evitaLab
</h1>

<p align="center">
    evitaLab is the official web-based GUI client for <a href="https://github.com/FgForrest/evitaDB">evitaDB</a> e-commerce database.
    Visit <a href="https://demo.evitadb.io" target="_blank">demo.evitadb.io</a> for the live demo.
</p>

<p align="center">
  <a href="https://github.com/lukashornych/evitalab/releases" title="Releases"><img src="https://img.shields.io/github/v/release/lukashornych/evitalab?color=%23ff00a0&include_prereleases&label=version&sort=semver"/></a>
  &nbsp;
  <a href="https://vuejs.org/" title="Platform"><img src="https://img.shields.io/badge/Built%20with-Vue-green?color=42b883"/></a>
  &nbsp;
  <a href="https://nodejs.org/en" title="Node.js"><img src="https://img.shields.io/badge/Node.js%20-v18.16.1-green?color=026e00"/></a>
  &nbsp;
  <a href="https://discord.gg/VsNBWxgmSw" title="Discord"><img src="https://img.shields.io/discord/999338870996992223?color=5865f2"/></a>
  &nbsp;
  <a href="https://github.com/lukashornych/evitalab/blob/master/LICENSE" title="License"><img src="https://img.shields.io/github/license/lukashornych/evitalab"/></a>
</p>

evitaLab aims to provide a user-friendly client for evitaDB database to easily browse and modify data stored in the database.

You can try out evitaLab with evitaDB demo dataset at [demo.evitadb.io](https://demo.evitadb.io).

![evitaLab preview](documentation/user/assets/img/preview.png)

## Features

evitaLab allows you to:

- ✅ inspect schemas
- ✅ browse entities in interactive table
- ✅ execute GraphQL queries
- ✅ execute evitaQL queries
- ✅ visualise extra results
- ✅ share tabs between developers
- ✅ manage connections to multiple evitaDB instances
- ✅ manage server (status, tasks, JFR recordings)
- ✅ manage catalogs and collections
- ✅ analyze server traffic

However, evitaLab is still in active development and more features are planned.

## Running locally

To run evitaLab locally, you can use either of the following ways.

### Desktop application

If you are looking for full local development experience, checkout the [evitaLab Desktop](https://github.com/lukashornych/evitalab-desktop/)
application instead. The desktop app builds on top of this evitaLab core and add proper server connection management as 
well as other useful features:

- ✅ connect to any server version in one app
- ✅ receive evitaLab core updates as soon as they are released without waiting for server update
- ✅ each connection stores its own tabs and history, even if each connection points to same server URL
    - _this is useful when you are using port forwarding for different server environments (prod, test, local) where local port is the same for each environment_
- ✅ connections styling for better distinction between servers and environments
- ✅ global notification system - displays toast notifications from desktop app and connections in one place
    - _this way you can see notifications from all connections all the time_

### Embedded in local evitaDB instance

If you don't want to install full desktop application, and you have evitaDB server running,
the easiest and quickest way to run evitaLab locally is to enable it inside your configuration of evitaDB.
By default, evitaDB will automatically expose its own local evitaLab instance on the [localhost:5555/lab](https://localhost:5555/lab)
address. For more configuration, see [evitaDB documentation](https://evitadb.io/documentation/operate/configure#lab-configuration).

### From dist

If you want to run evitaLab manually, you can download the latest release from [releases page](https://github.com/lukashornych/evitalab/releases/tag/latest)
and use any static web server to serve the files from `dist-standalone` directory. 
For example, you can use [nginx](https://docs.nginx.com/nginx/admin-guide/web-server/serving-static-content/)

This way you can host your own instance of evitaLab, for example, for your internal evitaDB server.

### From source

If you want to run a development version of the evitaLab, you can clone this repository.

Before you start, make sure you have [Node.js](https://nodejs.org/en/) in version specified in `.nvmrc` and [Yarn](https://yarnpkg.com/) 
package manager installed.

Then you can run it either in standalone mode:

```shell
yarn install
yarn dev
```

_this will start a development server on [localhost:3000/lab](http://localhost:3000/lab) address._

Or the driver mode (for [evitaLab Desktop](https://github.com/lukashornych/evitalab-desktop)):

```shell
yarn install
yarn dev-driver
```

_this will start a development server on [localhost:3000](http://localhost:3000) address._

## Development

If you would like to contribute to evitaLab source code or just simply play with it locally, you just need to
clone the project, install the [Node.js](https://nodejs.org/en/) in version specified in `.nvmrc` and [Yarn](https://yarnpkg.com/) (as that's what we use for development)
and run the following commands to run the evitaLab locally:

```shell
# running using yarn
yarn install
yarn dev
```

You can find more indepth info about internal structure and guidelines of evitaLab in [developer documentation](/documentation/developer/index.md).

## Licence

[Apache License 2.0](LICENSE)

## Contribution

Any contributions are welcome and appreciated. If you would like to contribute to evitaLab, feel free to open an issue
and submit a pull request.
