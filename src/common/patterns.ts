import createMatcher from "ignore";

type PackageNameMatcher = (name: string) => boolean;

export function createPackageNameMatcher(patterns: string[]): PackageNameMatcher {
	const matcher = createMatcher({ ignorecase: false });
	for (const pattern of patterns) {
		matcher.add(pattern);
	}
	// Note that the "ignores" function returns true, if the name matches.
	return (name: string) => matcher.ignores(name);
}
