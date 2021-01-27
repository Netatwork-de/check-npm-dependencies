import { minVersion, parse } from "semver";

export function normalizeVersion(version: string) {
	try {
		const simple = parse(version);
		if (simple) {
			return simple.version;
		}
		const min = minVersion(version);
		if (min) {
			return min.version;
		}
	} catch {}
	return version;
}

export function parseVersion(version: string) {
	const info = parse(normalizeVersion(version));
	if (info === null) {
		throw new Error(`Unable to parse version: ${JSON.stringify(version)}`);
	}
	return info;
}
