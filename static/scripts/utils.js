function escapeHtml(unsafe) {
  return (unsafe + "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function kFormat(num) {
  num = Math.floor(num);
  return Math.abs(num) > 999
    ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(1) + "K"
    : Math.sign(num) * Math.abs(num) + "";
}


function dGroupData(entries, cutAt) {
  var entrs = Object.entries(entries);
  entrs = entrs.sort((a, b) => b[1] - a[1]);
  var top = entrs.slice(0, cutAt);
  var bottom = entrs.slice(cutAt);

  otherVal = 0;
  bottom.forEach((el) => (otherVal += el[1]));
  if (otherVal) {
    top.push(["Other", otherVal]);
  }

  var res = Object.fromEntries(top);
  if ("Unknown" in res) {
    res["Other"] = (res["Other"] || 0) + res["Unknown"];
    delete res["Unknown"];
  }
  return res;
}
