import { spawn } from "child_process";

export function exec(cwd: string, command: string, ...args: string[]) {
	return new Promise<void>((resolve, reject) => {
		const proc = spawn(command, args, { cwd, stdio: "inherit", shell: true });
		proc.on("exit", (code, signal) => {
			if (code || signal) {
				reject(new Error(`Process "${command}${args.map(a => " " + a).join("")}" exited wrongly: ${code || signal}`));
			} else {
				resolve();
			}
		});
	});
}
