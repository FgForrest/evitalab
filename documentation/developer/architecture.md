# Codebase architecture

The evitaLab is initialized from the `main.ts` file where all modules, Vue plugins and other things are initialized and
put together.

![evitaLab infrastructure](assets/codebase-architecture.svg)

## Modules

The entire codebase is structure into modules that communicate between each other. In this case, modules are not JS
modules, they are more of semantic separation of domains into standalone directories.

There are three types of modules (again just a semantic separation):

- abstract module - provides common abstract services, models, UI component for other concrete modules
    - examples are:
        - `base`
        - `driver-support`
        - `console`
- generic module - provides a generic functionality for evitaLab features
    - examples are:
        - `config`
        - `connection`
        - `workspace`
- specific feature module - provides a specific feature for the user of evitaLab
    - examples are:
        - `entity-viewer`
        - `evitaql-console`
        - `schema-viewer`

## Vue plugins

Vue plugins are registered globally from `vue-plugins` directory in the `main.ts` file while [bootstrapping](#bootstrap).

## Assets, styles

There static resources for building the UI.

## Utils

Contains generic utilities for the codebase.

## Bootstrapping

The `main.ts` is responsible for initializing the entire evitaLab. It initializes the Vue App, Vue plugins and [modules](#modules).
In conjunction, the `Lab.vue` is the main Vue component registering basic router components.

There is also support for initializing the modules.

