import {check_ua, waiting} from './utility';

waiting(1000).then((time) => {
	console.log(`UserAgent: 【${check_ua.ua}】`);
	return waiting(time)
}).then((time) => {
	console.log(`ViewDevice: 【${check_ua.device()}】`);
});
