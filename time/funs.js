function fileName() {
	var nowTime = new Date(Date.now());
	
	var nowYear = 1900 + nowTime.getYear();
	var nowMonth = 1 + nowTime.getMonth();
	var nowDate = nowTime.getDate();
	var nowHour = nowTime.getHours();
	var nowMin = nowTime.getMinutes();
	var nowSec = nowTime.getSeconds();
	
	return nowYear.toString() + '_' +
	       nowMonth.toString() + '_' +
	       nowDate.toString() + '_' +
	       nowHour.toString() + '_' +
	       nowMin.toString() + '_' +
	       nowSec.toString() + '.png';
}