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
			"no-duplicates": true,
			"no-missmatch": true
		}
	}
}
```
+ nawCheckNpmDependencies `<array | object>` - A single or an array of multiple configuration objects.
	+ dev `<boolean>` - Optional. True, to include dev dependencies. Default is `false`.
	+ patterns `<string[]>` - Optional. An array of gitignore like patterns to include packages. If not specified, all packages are checked.
	+ rules `<object>` - Optional. An object with rules to use. If not specified, all rules are used.
		+ `no-duplicates` - Assert that no package is installed on multiple paths.
		+ `no-missmatch` - Assert that only one version is required.

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
