# @netatwork/check-npm-dependencies
A linter for bundled npm dependencies

## Installation
```bash
npm i -D @netatwork/check-npm-dependencies
```

## Configuration
```json5
// package.json
{
	"nawCheckNpmDependencies": {
		"dev": false,
		"patterns": [
			"*"
		],
		"rules": {
			"noDuplicates": true,
			"noMissmatch": true
		}
	}
}
```
+ nawCheckNpmDependencies `<Config>` - Can be one of the following:
	+ `<Config[]>` - An array of configuration objects.
	+ `<string>` - A filename of a json(5) file to load the config from.
	+ `<object>` - An object with the following properties:
		+ extends `<string>` - Optional. A filename of a json(5) file to load and use as fallback for unspecified properties.
		+ dev `<boolean>` - Optional. True, to also check dev dependencies. Default is `false`.
		+ patterns `<string[]>` - Optional. An array of gitignore like patterns to include packages. If not specified, all packages are checked.
		+ rules `<object>` - Optional. An object with rules to use. If not specified, all rules are used.
			+ `noDuplicates` - Assert that no package is installed on multiple paths.
			+ `noMissmatch` - Assert that only one version is required.

## Usage
Run from a script:
```bash
npx naw-check-npm-dependencies
```
Or add a script to your `package.json`
```json5
{
	"scripts": {
		"test": "naw-check-npm-dependencies && ..."
	}
}
```

Some issues can be resolved automatically:<br>
If `--fix-duplicates` is specified, the cli will attempt to remove duplicate package installations and then perform a clean install:
```bash
npx naw-check-npm-dependencies --fix-duplicates
```
