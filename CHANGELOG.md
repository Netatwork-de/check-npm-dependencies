
# 4.0
+ **Breaking change:** Config now uses rules as top level properties instead of patterns and rules in a separate object.
+ **Breaking change:** Version 3 package locks are now the only supported format.
+ **Breaking change:** `--fix-duplicates` argument has been removed. Update dependencies or use npm overrides if necessary.

# 3.1
+ Support version 2 package lock files.

# 3.0
+ **Breaking change:** The config format has been changed:
    + Rule names are now camel cased.
    + An `extends` property can be used to move common properties to other files.
    + A config can now also be a filename, or an array of configs.
+ New command line flag added `--fix-duplicates`.

# 2.0
+ **Breaking change:** Requires node 14 or above.
