/*global document */
(function(document) {
	var source = document.getElementById('Source');
	if (!source) { return; }

	var anchorHash = document.location.hash.substr(1),
		lines = source.getElementsByTagName('li'),
		idx = 0,
		totalLines = lines.length,
		lineNumber = 0,
		lineId;

	for (; idx < totalLines; idx++) {
		lineNumber++;
		lineId = 'line' + lineNumber;
		lines[idx].id = lineId;
		if (lineId === anchorHash) {
			lines[idx].className += ' selected';
		}
	}
}(document));
