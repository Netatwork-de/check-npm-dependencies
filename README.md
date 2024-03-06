# @netatwork/check-npm-dependencies
A linter for package locks.

## Installation
```bash
npm i -D @netatwork/check-npm-dependencies
```

## Configuration
```js
// package.json
{
  ...
  "nawCheckNpmDependencies": {
    "extends": "./some-shared-config.json",
    "noDuplicates": [
      "@example/*"
    ],
    "sameVersions": [
      "@example/*",
      [
        "example-a-*",
        "example-b"
      ]
    ]
  }
}
```
+ **nawCheckNpmDependencies** `<Config>` - Can be a path to load the config from or an object with the following options:
  + **extends** `<string>` - A path to load a config from to extend.
  + **noDuplicates** `<string[]>` - An array of package name patterns to check for duplicates.
    + In the example above, all packages within the `@example` scope are checked for duplicates.
  + **sameVersions** `<(string | string[])[]>` - An array of patterns or pattern groups to ensure that all packages within a group have the same versions.
    + In the example above, all packages within the `@example` scope are checked for the same version and `example-a-*` and `example-b` are checked for the same version.

## Usage
```bash
# Run via npx:
npx naw-check-npm-dependencies [...args]
```
```js
// Or add to your package.json:
{
  "scripts": {
    "test": "naw-check-npm-dependencies ..."
  }
}
```

+ `--context | -c <path>` - The path at which to look for a `package.json` and `package-lock.json`.
