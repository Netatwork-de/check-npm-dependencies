import { minVersion, parse } from "semver";

export type Versions = Map<string, {
	readonly paths: string[][];
}>;

export class VersionMap {
	private readonly _map = new Map<string, Versions>();

	public [Symbol.iterator]() {
		return this._map[Symbol.iterator]();
	}

	public add(name: string, version: string, path: string[]) {
		version = normalizeVersion(version);
		const versions = this._map.get(name);
		if (versions) {
			const info = versions.get(version);
			if (info) {
				info.paths.push(path);
			} else {
				versions.set(version, {
					paths: [path]
				});
			}
		} else {
			this._map.set(name, new Map([
				[version, {
					paths: [path]
				}]
			]));
		}
	}

	public static hasMultiplePaths(versions: Versions) {
		if (versions.size > 1) {
			return true;
		}
		for (const [, version] of versions) {
			if (version.paths.length > 1) {
				return true;
			}
		}
		return false;
	}
}

function normalizeVersion(version: string) {
	const simple = parse(version);
	if (simple) {
		return simple.version;
	}
	const min = minVersion(version);
	if (min) {
		return min.version;
	}
	return version;
}
