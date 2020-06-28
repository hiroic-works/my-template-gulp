//user agent
export const check_ua = {
	ua: navigator.userAgent,
	device() {
		if (
			this.ua.indexOf('iPhone') > 0 ||
			this.ua.indexOf('iPod') > 0 ||
			this.ua.indexOf('Android') > 0 &&
			this.ua.indexOf('Mobile') > 0 ||
			this.ua.indexOf('Windows Phone') > 0
		) {
			return 'sp';
		} else if (
			this.ua.indexOf('iPad') > 0 ||
			this.ua.indexOf('Android') > 0
		) {
			return 'tablet';
		} else {
			return 'other';
		}
	}
};

export const waiting = (waittime) => {
	return new Promise((resolve, reject) => {
		if (waittime) {
			setTimeout(function () {
				resolve(waittime);
			}, waittime);
		} else {
			resolve();
		}
	});
};
