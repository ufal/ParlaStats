let _cfg;
export async function loadConfig() {
	if (_cfg) return _cfg;
	const res = await fetch('./config/conf.json');
	if (!res.ok) throw new Error (`Config fetch failed ${res.status}`);
	_cfg = await res.json();
	return _cfg;
}
