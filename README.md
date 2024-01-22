<h1 align="center" style="border-bottom: none">
    <a href="https://evitadb.io" target="_blank"><img src="https://raw.githubusercontent.com/lukashornych/evitalab/dev/documentation/assets/img/evitalab.svg"/></a><br>evitaLab
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

evitaLab aims to provide a user-friendly client for evitaDB database to easily browse data stored in the database.
In the future, evitaLab will hopefully also allow data modifications.

You can try out evitaLab with evitaDB demo dataset at [demo.evitadb.io](https://demo.evitadb.io).

![evitaLab preview](documentation/assets/img/preview.png)

## Features

evitaLab is currently in early development stage, and features are being added as we go.

evitaLab allows you to:

- [x] inspect schemas
- [x] browse entities in interactive table
- [x] execute GraphQL queries
- [x] execute evitaQL queries
- [x] visualise extra results 
- [x] manage connections to multiple evitaDB instances

## Running locally

To run evitaLab locally, you can use either of the following ways. 
In the future, we plan to provide pre-built binaries for all major desktop platforms, but currently [the docker image](#docker)
is the closest thing we have.

### Embedded in local evitaDB instance

The easiest and quickest way to run evitaLab locally is to enable it inside your configuration of evitaDB.
By default, evitaDB will automatically expose its own local evitaLab instance on the [localhost:5555/lab](https://localhost:5555/lab)
address. For more configuration, see [evitaDB documentation](https://evitadb.io/documentation/operate/configure#lab-configuration).

### Docker

The easiest and quickest way to run evitaLab locally without running evitaDB is to use Docker. 
You can use the following command to install evitaLab locally:

```shell
docker run --name evitalab -ti -p 5566:3000 ghcr.io/lukashornych/evitalab:latest
```
 
Next time you want to run the evitaLab, simply start use:

```shell
docker start evitalab
````

This will expose an evitaLab instance on [localhost:5566/lab](http://localhost:5566/lab) address.

### From dist

If you want to run evitaLab manually, you can download the latest release from [releases page](https://github.com/lukashornych/evitalab/releases/tag/latest)
and use any static web server to serve the files from `dist` directory. 
For example, you can use [nginx](https://docs.nginx.com/nginx/admin-guide/web-server/serving-static-content/)

### From source

If you want to run a development version of the evitaLab, you can clone this repository.

Before you start, make sure you have [Node.js](https://nodejs.org/en/) v18.16.1 installed. 
Optionally, you can also install [Yarn](https://yarnpkg.com/) package manager.

```shell
# running using npm
npm install
npm run dev

# running using yarn
yarn install
yarn dev
```

This will start a development server on [localhost:3000/lab](http://localhost:3000/lab) address.

## Development

If you would like to contribute to evitaLab source code or just simply play with it locally, you just need to
clone the project, install the [Node.js](https://nodejs.org/en/) v18.16.1 
(you can also install [Yarn](https://yarnpkg.com/) as that's what we use for development)
and run the following commands to run the evitaLab locally:

```shell
# running using npm
npm install
npm run dev

# running using yarn
yarn install
yarn dev
```

## Licence

[Apache License 2.0](LICENSE)

## Contribution

Any contributions are welcome and appreciated. If you would like to contribute to evitaLab, feel free to open an issue
and submit a pull request. However, keep in mind that this project is still in an early development stage and features
may change or be completely removed.
