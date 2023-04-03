var request = require('request');
var serverConfig = require('../../global/severConfig')
var OPCURL = serverConfig.opcAddress;
var logFromPC = require('../clsLogger');
const ErrorLog = require('../../model/clsErrorLog');
const date = require('date-and-time');
// var Tracker = require('../clsTracker');
class OPC {

  async exportToOPC_Balance(strBalanceId, objBalValues) {
    var arrBal = [];
    var strTagName= "GOAUVIIB_Balance.";
    arrBal.push({ "id": strTagName + strBalanceId + ".TestName", "v": objBalValues.TestName });
    arrBal.push({ "id": strTagName + strBalanceId + ".ProductName", "v": objBalValues.ProductName });
    arrBal.push({ "id": strTagName + strBalanceId + ".TestStart", "v": objBalValues.TestStart });
    arrBal.push({ "id": strTagName + strBalanceId + ".NoOfSample_GrpWt", "v": objBalValues.NoOfSample_GrpWt });
    arrBal.push({ "id": strTagName + strBalanceId + ".NoOfSample_IndiWt", "v": objBalValues.NoOfSample_IndiWt });
    arrBal.push({ "id": strTagName + strBalanceId + ".BatchNo", "v": objBalValues.BatchNo });
    arrBal.push({ "id": strTagName + strBalanceId + ".Side", "v": objBalValues.Side });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMaximumGrpWeight", "v": objBalValues.ActMaximumGrpWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMinimumGrpWeight", "v": objBalValues.ActMinimumGrpWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".AverageGrpWeight", "v": objBalValues.AverageGrpWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMaximumIndiWeight", "v": objBalValues.ActMaximumIndiWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMinimumIndiWeight", "v": objBalValues.ActMinimumIndiWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".AverageIndiWeight", "v": objBalValues.AverageIndiWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".TestResult_GrpWtVariation", "v": objBalValues.TestResult_GrpWtVariation });
    arrBal.push({ "id": strTagName + strBalanceId + ".TestResult_IndiWtVariation", "v": objBalValues.TestResult_IndiWtVariation });
    arrBal.push({ "id": strTagName + strBalanceId + ".TestEnd", "v": objBalValues.TestEnd });
    arrBal.push({ "id": strTagName + strBalanceId + ".Lot", "v": objBalValues.Lot });


    // objBalValues.intValue.forEach((value,i) => {
    //     arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".value" + i+1 , "v": value });
    // });

    // request.post({ url:OPCURL , form: arrBal }, function (err, httpResponse, body) { 
    //     if (err) {
    //         console.log(err);
    //     } else { 
    //         console.log(body);
    //     }
    // })
    console.log(arrBal)
    request({
      url: OPCURL,
      method: 'POST',
      body: arrBal,
      json: true
    }, function (err, response, body) {

      if (err) {
        console.log('Error while posting data to OPC', err)
        //   let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : " + err;
        var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strBalanceId + ":Body:"+arrBal;
        logError = logError + err.stack;
        //commented by vivek on 15-08-2020*********************************** */
        //ErrorLog.error(logError);
        ErrorLog.addToErrorLog(logError);
        //******************************************************************* */
      } else {
        if (body == null || body == undefined) {
          console.log('Error while posting data to OPC, Something got null and undefined');
          let msg = "Error while posting data to OPC, Something got null and undefined";
          var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strBalanceId + ": Body:"+arrBal;
          logError = logError + msg;
          //commented by vivek on 15-08-2020*********************************** */
          //ErrorLog.error(logError);
          ErrorLog.addToErrorLog(logError);
          //******************************************************************* */
        } else {
          console.log('Data posted to OPC', body);
          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : OPC Data posted successfully" + body;
          //commented by vivek on 18-08-2020********************************
          //logFromPC.info(logQ);
          // logFromPC.addtoProtocolLog(logQ)
          //************************************************************** */
        }
      }
    });
  }
  async exportToOPC_BalanceCap(strBalanceId, objBalValues) {
    var arrBal = [];
    var strTagName= "GOAUVIIB_Balance.";
    arrBal.push({ "id": strTagName + strBalanceId + ".TestName", "v": objBalValues.TestName });
    arrBal.push({ "id": strTagName + strBalanceId + ".ProductName", "v": objBalValues.ProductName });
    arrBal.push({ "id": strTagName + strBalanceId + ".TestStart", "v": objBalValues.TestStart });
    arrBal.push({ "id": strTagName + strBalanceId + ".NoOfSample_GrpWt", "v": objBalValues.NoOfSample_GrpWt });
    arrBal.push({ "id": strTagName + strBalanceId + ".NoOfSample_IndiWt", "v": objBalValues.NoOfSample_IndiWt });
    arrBal.push({ "id": strTagName + strBalanceId + ".NoOfSample_DiffWt", "v": 0});
    arrBal.push({ "id": strTagName + strBalanceId + ".BatchNo", "v": objBalValues.BatchNo });
    arrBal.push({ "id": strTagName + strBalanceId + ".Side", "v": objBalValues.Side });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMaximumGrpWeight", "v": objBalValues.ActMaximumGrpWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMinimumGrpWeight", "v": objBalValues.ActMinimumGrpWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".AverageGrpWeight", "v": objBalValues.AverageGrpWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMaximumIndiWeight", "v": objBalValues.ActMaximumIndiWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMinimumIndiWeight", "v": objBalValues.ActMinimumIndiWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".AverageIndiWeight", "v": objBalValues.AverageIndiWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".TestResult_GrpWtVariation", "v": objBalValues.TestResult_GrpWtVariation });
    arrBal.push({ "id": strTagName + strBalanceId + ".TestResult_IndiWtVariation", "v": objBalValues.TestResult_IndiWtVariation });
    arrBal.push({ "id": strTagName + strBalanceId + ".TestEnd", "v": objBalValues.TestEnd });
    arrBal.push({ "id": strTagName + strBalanceId + ".Lot", "v": objBalValues.Lot });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMaximumNetWeight", "v": 0 });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMinimumNetWeight", "v": 0 });
    arrBal.push({ "id": strTagName + strBalanceId + ".AverageNetWeight", "v": 0 });
    arrBal.push({ "id": strTagName + strBalanceId + ".TestResult_DiffWtVariation", "v": false });


    //     arrBal.push({ "id": strTagName + strBalanceId + ".TestName", "v": objBalValues.TestName });
    // arrBal.push({ "id": strTagName + strBalanceId + ".ProductName", "v": objBalValues.ProductName });
    // arrBal.push({ "id": strTagName + strBalanceId + ".TestStart", "v": objBalValues.TestStart });
    // arrBal.push({ "id": strTagName + strBalanceId + ".NoOfSample_GrpWt", "v": 0 });
    // arrBal.push({ "id": strTagName + strBalanceId + ".NoOfSample_IndiWt", "v": 0 });
    // arrBal.push({ "id": strTagName + strBalanceId + ".NoOfSample_DiffWt", "v": objBalValues.NoOfSample_DiffWt });
    // arrBal.push({ "id": strTagName + strBalanceId + ".BatchNo", "v": objBalValues.BatchNo });
    // arrBal.push({ "id": strTagName + strBalanceId + ".Side", "v": objBalValues.Side });
    // arrBal.push({ "id": strTagName + strBalanceId + ".ActMaximumGrpWeight", "v": 0 });
    // arrBal.push({ "id": strTagName + strBalanceId + ".ActMinimumGrpWeight", "v": 0 });
    // arrBal.push({ "id": strTagName + strBalanceId + ".AverageGrpWeight", "v": 0 });
    // arrBal.push({ "id": strTagName + strBalanceId + ".ActMaximumIndiWeight", "v": 0 });
    // arrBal.push({ "id": strTagName + strBalanceId + ".ActMinimumIndiWeight", "v": 0 });
    // arrBal.push({ "id": strTagName + strBalanceId + ".AverageIndiWeight", "v": 0 });
    // arrBal.push({ "id": strTagName + strBalanceId + ".TestResult_GrpWtVariation", "v": false });
    // arrBal.push({ "id": strTagName + strBalanceId + ".TestResult_IndiWtVariation", "v": false });
    // arrBal.push({ "id": strTagName + strBalanceId + ".TestEnd", "v": objBalValues.TestEnd });
    // arrBal.push({ "id": strTagName + strBalanceId + ".Lot", "v": objBalValues.Lot });
    // arrBal.push({ "id": strTagName + strBalanceId + ".ActMaximumNetWeight", "v": objBalValues.ActMaximumNetWeight });
    // arrBal.push({ "id": strTagName + strBalanceId + ".ActMinimumNetWeight", "v": objBalValues.ActMinimumNetWeight });
    // arrBal.push({ "id": strTagName + strBalanceId + ".AverageNetWeight", "v": objBalValues.AverageNetWeight });
    // arrBal.push({ "id": strTagName + strBalanceId + ".TestResult_DiffWtVariation", "v": objBalValues.TestResult_DiffWtVariation });
    // objBalValues.intValue.forEach((value,i) => {
    //     arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".value" + i+1 , "v": value });
    // });

    // request.post({ url:OPCURL , form: arrBal }, function (err, httpResponse, body) { 
    //     if (err) {
    //         console.log(err);
    //     } else { 
    //         console.log(body);
    //     }
    // })
    console.log(arrBal)
    request({
      url: OPCURL,
      method: 'POST',
      body: arrBal,
      json: true
    }, function (err, response, body) {

      if (err) {
        console.log('Error while posting data to OPC', err)
        //   let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : " + err;
        var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strBalanceId + ":Body:"+arrBal;
        logError = logError + err.stack;
        //commented by vivek on 15-08-2020*********************************** */
        //ErrorLog.error(logError);
        ErrorLog.addToErrorLog(logError);
        //******************************************************************* */
      } else {
        if (body == null || body == undefined) {
          console.log('Error while posting data to OPC, Something got null and undefined');
          let msg = "Error while posting data to OPC, Something got null and undefined";
          var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strBalanceId + ": Body:"+arrBal;
          logError = logError + msg;
          //commented by vivek on 15-08-2020*********************************** */
          //ErrorLog.error(logError);
          ErrorLog.addToErrorLog(logError);
          //******************************************************************* */
        } else {
          console.log('Data posted to OPC', body);
          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : OPC Data posted successfully" + body;
          //commented by vivek on 18-08-2020********************************
          //logFromPC.info(logQ);
          // logFromPC.addtoProtocolLog(logQ)
          //************************************************************** */
        }
      }
    });
  }
  async exportToOPC_Vernier(strVernierId, objBalValues) {
    var arrBal = [];
    var strTagName= "GOAUVIIB_Vernier.";
    arrBal.push({ "id": strTagName + strVernierId + ".ActMaximumBreadth", "v": objBalValues.ActMaximumBreadth });
    arrBal.push({ "id": strTagName + strVernierId + ".ActMaximumDiameter", "v": objBalValues.ActMaximumDiameter });
    arrBal.push({ "id": strTagName + strVernierId + ".ActMaximumLength", "v": objBalValues.ActMaximumLength });
    arrBal.push({ "id": strTagName + strVernierId + ".ActMaximumThickness", "v": objBalValues.ActMaximumThickness });
    arrBal.push({ "id": strTagName + strVernierId + ".ActMinimumBreadth", "v": objBalValues.ActMinimumBreadth });
    arrBal.push({ "id": strTagName + strVernierId + ".ActMinimumDiameter", "v": objBalValues.ActMinimumDiameter });
    arrBal.push({ "id": strTagName + strVernierId + ".ActMinimumLength", "v": objBalValues.ActMinimumLength });
    arrBal.push({ "id": strTagName + strVernierId + ".ActMinimumThickness", "v": objBalValues.ActMinimumThickness });
    arrBal.push({ "id": strTagName + strVernierId + ".AverageBreadth", "v": objBalValues.AverageBreadth });
    arrBal.push({ "id": strTagName + strVernierId + ".AverageThickness", "v": objBalValues.AverageThickness });
    arrBal.push({ "id": strTagName + strVernierId + ".AverageDiameter", "v": objBalValues.AverageDiameter });
    arrBal.push({ "id": strTagName + strVernierId + ".AverageLength", "v": objBalValues.AverageLength });
    arrBal.push({ "id": strTagName + strVernierId + ".BatchNo", "v": objBalValues.BatchNo });
    arrBal.push({ "id": strTagName + strVernierId + ".Lot", "v": objBalValues.Lot });
    arrBal.push({ "id": strTagName + strVernierId + ".NoOfSample_Breadth", "v": objBalValues.NoOfSample_Breadth });
    arrBal.push({ "id": strTagName + strVernierId + ".NoOfSample_Diameter", "v": objBalValues.NoOfSample_Diameter });
    arrBal.push({ "id": strTagName + strVernierId + ".NoOfSample_Length", "v": objBalValues.NoOfSample_Length });
    arrBal.push({ "id": strTagName + strVernierId + ".NoOfSample_Thickness", "v": objBalValues.NoOfSample_Thickness });
    arrBal.push({ "id": strTagName + strVernierId + ".ProductName", "v": objBalValues.ProductName });
    arrBal.push({ "id": strTagName + strVernierId + ".Side", "v": objBalValues.Side });
    arrBal.push({ "id": strTagName + strVernierId + ".TestEnd", "v": objBalValues.TestEnd });
    arrBal.push({ "id": strTagName + strVernierId + ".TestName", "v": objBalValues.TestName });
    arrBal.push({ "id": strTagName + strVernierId + ".TestResult_Breadth", "v": objBalValues.TestResult_Breadth });
    arrBal.push({ "id": strTagName + strVernierId + ".TestResult_Diameter", "v": objBalValues.TestResult_Diameter });
    arrBal.push({ "id": strTagName + strVernierId + ".TestResult_Length", "v": objBalValues.TestResult_Length });
    arrBal.push({ "id": strTagName + strVernierId + ".TestResult_Thickness", "v": objBalValues.TestResult_Thickness });
    arrBal.push({ "id": strTagName + strVernierId + ".TestStart", "v": objBalValues.TestStart });



    // objBalValues.intValue.forEach((value,i) => {
    //     arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".value" + i+1 , "v": value });
    // });

    // request.post({ url:OPCURL , form: arrBal }, function (err, httpResponse, body) { 
    //     if (err) {
    //         console.log(err);
    //     } else { 
    //         console.log(body);
    //     }
    // })

    console.log(arrBal);
    request({
      url: OPCURL,
      method: 'POST',
      body: arrBal,
      json: true
    }, function (err, response, body) {

      if (err) {
        console.log('Error while posting data to OPC', err)
        //   let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : " + err;
        var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strVernierId + ":";
        logError = logError + err.stack;
        //commented by vivek on 15-08-2020*********************************** */
        //ErrorLog.error(logError);
        ErrorLog.addToErrorLog(logError);
        //******************************************************************* */
      } else {
        if (body == null || body == undefined) {
          console.log('Error while posting data to OPC, Something got null and undefined');
          let msg = "Error while posting data to OPC, Something got null and undefined";
          var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strVernierId + ":";
          logError = logError + msg;
          //commented by vivek on 15-08-2020*********************************** */
          //ErrorLog.error(logError);
          ErrorLog.addToErrorLog(logError);
          //******************************************************************* */
        } else {
          console.log('Data posted to OPC', body);
          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strVernierId + " : OPC Data posted successfully" + body;
          //commented by vivek on 18-08-2020********************************
          //logFromPC.info(logQ);
          // logFromPC.addtoProtocolLog(logQ)
          //************************************************************** */
        }
      }
    });
  }
  async exportToOPC_MultiParamHardness(strHardnessId, objBalValues) {
    var arrBal = [];
    var strTagName= "GOAUVIIB_HardnessTester.";
    arrBal.push({ "id": strTagName + strHardnessId + ".ActMaximumDiameter", "v": objBalValues.ActMaximumDiameter });
    arrBal.push({ "id": strTagName + strHardnessId + ".ActMaximumHardness", "v": objBalValues.ActMaximumHardness });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".Date", "v": objBalValues.strDate });
    arrBal.push({ "id": strTagName + strHardnessId + ".ActMaximumlength", "v": objBalValues.ActMaximumlength });
    arrBal.push({ "id": strTagName + strHardnessId + ".ActMaximumThickness", "v": objBalValues.ActMaximumThickness });
    arrBal.push({ "id": strTagName + strHardnessId + ".ActMinimumDiameter", "v": objBalValues.ActMinimumDiameter });
    arrBal.push({ "id": strTagName + strHardnessId + ".ActMinimumHardness", "v": objBalValues.ActMinimumHardness });
    arrBal.push({ "id": strTagName + strHardnessId + ".ActMinimumlength", "v": objBalValues.ActMinimumlength });
    arrBal.push({ "id": strTagName + strHardnessId + ".ActMinimumThickness", "v": objBalValues.ActMinimumThickness });
    arrBal.push({ "id": strTagName + strHardnessId + ".AverageDiameter", "v": objBalValues.AverageDiameter });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".maximum_indi", "v": objBalValues.intMaximumInd });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".minimum_indi", "v": objBalValues.intMinimumInd });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".average_indi", "v": objBalValues.intAverage });
    arrBal.push({ "id": strTagName + strHardnessId + ".AverageHardness", "v": objBalValues.AverageHardness });
    arrBal.push({ "id": strTagName + strHardnessId + ".Averagelength", "v": objBalValues.Averagelength });
    arrBal.push({ "id": strTagName + strHardnessId + ".AverageThickness", "v": objBalValues.AverageThickness });
    arrBal.push({ "id": strTagName + strHardnessId + ".BatchNo", "v": objBalValues.BatchNo });
    arrBal.push({ "id": strTagName + strHardnessId + ".Lot", "v": objBalValues.Lot });
    arrBal.push({ "id": strTagName + strHardnessId + ".NoOfSample", "v": objBalValues.NoOfSample });
    arrBal.push({ "id": strTagName + strHardnessId + ".ProductName", "v": objBalValues.ProductName });
    arrBal.push({ "id": strTagName + strHardnessId + ".Side", "v": objBalValues.Side });
    arrBal.push({ "id": strTagName + strHardnessId + ".TestEnd", "v": objBalValues.TestEnd });
    arrBal.push({ "id": strTagName + strHardnessId + ".TestName", "v": objBalValues.TestName });
    arrBal.push({ "id": strTagName + strHardnessId + ".TestResultDiameter", "v": objBalValues.TestResultDiameter });
    arrBal.push({ "id": strTagName + strHardnessId + ".TestResultHardness", "v": objBalValues.TestResultHardness });
    arrBal.push({ "id": strTagName + strHardnessId + ".TestResultlength", "v": objBalValues.TestResultlength });
    arrBal.push({ "id": strTagName + strHardnessId + ".TestResultThickness", "v": objBalValues.TestResultThickness });
    arrBal.push({ "id": strTagName + strHardnessId + ".TestStart", "v": objBalValues.TestStart });
    console.log(arrBal)

    // objBalValues.intValue.forEach((value,i) => {
    //     arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".value" + i+1 , "v": value });
    // });

    // request.post({ url:OPCURL , form: arrBal }, function (err, httpResponse, body) { 
    //     if (err) {
    //         console.log(err);
    //     } else { 
    //         console.log(body);
    //     }
    // })


    request({
      url: OPCURL,
      method: 'POST',
      body: arrBal,
      json: true
    }, function (err, response, body) {

      if (err) {
        console.log('Error while posting data to OPC', err)
        //   let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : " + err;
        var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strHardnessId + ":";
        logError = logError + err.stack;
        //commented by vivek on 15-08-2020*********************************** */
        //ErrorLog.error(logError);
        ErrorLog.addToErrorLog(logError);
        //******************************************************************* */
      } else {
        if (body == null || body == undefined) {
          console.log('Error while posting data to OPC, Something got null and undefined');
          let msg = "Error while posting data to OPC, Something got null and undefined";
          var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strHardnessId + ":";
          logError = logError + msg;
          //commented by vivek on 15-08-2020*********************************** */
          //ErrorLog.error(logError);
          ErrorLog.addToErrorLog(logError);
          //******************************************************************* */
        } else {
          console.log('Data posted to OPC', body);
          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strHardnessId + " : OPC Data posted successfully" + body;
          //commented by vivek on 18-08-2020********************************
          //logFromPC.info(logQ);
          // logFromPC.addtoProtocolLog(logQ)
          //************************************************************** */
        }
      }
    });
  }
  async exportToOPC_MA(strMAId, objBalValues) {
    var arrBal = [];
    var strTagName= "GOAUVIIB_MoistAnly.";
    arrBal.push({ "id": strTagName + strMAId + ".BatchNo", "v": objBalValues.BatchNo });
    arrBal.push({ "id": strTagName + strMAId + ".TestStart", "v": objBalValues.TestStart });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".Date", "v": objBalValues.strDate });
    arrBal.push({ "id": strTagName + strMAId + ".SetDryingTemp", "v": parseFloat(objBalValues.SetDryingTemp) });
    arrBal.push({ "id": strTagName + strMAId + ".TestEnd", "v": objBalValues.TestEnd });
    arrBal.push({ "id": strTagName + strMAId + ".FinalWeight", "v": parseFloat(objBalValues.FinalWeight) });
    arrBal.push({ "id": strTagName + strMAId + ".Layer", "v": objBalValues.Layer });
    arrBal.push({ "id": strTagName + strMAId + ".ActLossOnDrying", "v": parseFloat(objBalValues.ActLossOnDrying) });
    arrBal.push({ "id": strTagName + strMAId + ".Lot", "v": objBalValues.Lot });
    arrBal.push({ "id": strTagName + strMAId + ".ProdName", "v": objBalValues.ProdName });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".maximum_indi", "v": objBalValues.intMaximumInd });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".minimum_indi", "v": objBalValues.intMinimumInd });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".average_indi", "v": objBalValues.intAverage });
    arrBal.push({ "id": strTagName + strMAId + ".TestResult", "v": objBalValues.TestResult });
    arrBal.push({ "id": strTagName + strMAId + ".Stage", "v": objBalValues.Stage });
    arrBal.push({ "id": strTagName + strMAId + ".StartWeight", "v": parseFloat(objBalValues.StartWeight) });
    arrBal.push({ "id": strTagName + strMAId + ".TestName", "v": objBalValues.TestName });

    console.log(arrBal)
    // objBalValues.intValue.forEach((value,i) => {
    //     arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".value" + i+1 , "v": value });
    // });

    // request.post({ url:OPCURL , form: arrBal }, function (err, httpResponse, body) { 
    //     if (err) {
    //         console.log(err);
    //     } else { 
    //         console.log(body);
    //     }
    // })


    request({
      url: OPCURL,
      method: 'POST',
      body: arrBal,
      json: true
    }, function (err, response, body) {

      if (err) {
        console.log('Error while posting data to OPC', err)
        //   let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : " + err;
        var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strMAId + ":";
        logError = logError + err.stack;
        //commented by vivek on 15-08-2020*********************************** */
        //ErrorLog.error(logError);
        ErrorLog.addToErrorLog(logError);
        //******************************************************************* */
      } else {
        if (body == null || body == undefined) {
          console.log('Error while posting data to OPC, Something got null and undefined');
          let msg = "Error while posting data to OPC, Something got null and undefined";
          var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strMAId + ":";
          logError = logError + msg;
          //commented by vivek on 15-08-2020*********************************** */
          //ErrorLog.error(logError);
          ErrorLog.addToErrorLog(logError);
          //******************************************************************* */
        } else {
          console.log('Data posted to OPC', body);
          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strMAId + " : OPC Data posted successfully" + body;
          //commented by vivek on 18-08-2020********************************
          //logFromPC.info(logQ);
          // logFromPC.addtoProtocolLog(logQ)
          //************************************************************** */
        }
      }
    });
  }
  async exportToOPC_DT(strDTId, objBalValues) {
    var arrBal = [];
    var strTagName= "GOAUVIIB_DT.";
    arrBal.push({ "id": strTagName + strDTId + ".ActMaximumTemp", "v": objBalValues.ActMaximumTemp });
    arrBal.push({ "id": strTagName + strDTId + ".ActMaxTimeLHS", "v": objBalValues.ActMaxTimeLHS });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".Date", "v": objBalValues.strDate });
    arrBal.push({ "id": strTagName + strDTId + ".ActMaxTimeRHS", "v": objBalValues.ActMaxTimeRHS });
    arrBal.push({ "id": strTagName + strDTId + ".ActMinimumTemp", "v": objBalValues.ActMinimumTemp });
    arrBal.push({ "id": strTagName + strDTId + ".BatchNo", "v": objBalValues.BatchNo });
    arrBal.push({ "id": strTagName + strDTId + ".Lot", "v": objBalValues.Lot });
    arrBal.push({ "id": strTagName + strDTId + ".NoOfSample", "v": objBalValues.NoOfSample });
    arrBal.push({ "id": strTagName + strDTId + ".ProductName", "v": objBalValues.ProductName });
    arrBal.push({ "id": strTagName + strDTId + ".Side", "v": objBalValues.Side });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".maximum_indi", "v": objBalValues.intMaximumInd });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".minimum_indi", "v": objBalValues.intMinimumInd });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".average_indi", "v": objBalValues.intAverage });
    arrBal.push({ "id": strTagName + strDTId + ".TestEnd", "v": objBalValues.TestEnd });
    arrBal.push({ "id": strTagName + strDTId + ".TestName", "v": objBalValues.TestName });
    arrBal.push({ "id": strTagName + strDTId + ".TestResult", "v": objBalValues.TestResult });
    arrBal.push({ "id": strTagName + strDTId + ".TestStart", "v": objBalValues.TestStart });

    console.log(arrBal)
    // objBalValues.intValue.forEach((value,i) => {
    //     arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".value" + i+1 , "v": value });
    // });

    // request.post({ url:OPCURL , form: arrBal }, function (err, httpResponse, body) { 
    //     if (err) {
    //         console.log(err);
    //     } else { 
    //         console.log(body);
    //     }
    // })


    request({
      url: OPCURL,
      method: 'POST',
      body: arrBal,
      json: true
    }, function (err, response, body) {

      if (err) {
        console.log('Error while posting data to OPC', err)
        //   let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : " + err;
        var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strDTId + ":";
        logError = logError + err.stack;
        //commented by vivek on 15-08-2020*********************************** */
        //ErrorLog.error(logError);
        ErrorLog.addToErrorLog(logError);
        //******************************************************************* */
      } else {
        if (body == null || body == undefined) {
          console.log('Error while posting data to OPC, Something got null and undefined');
          let msg = "Error while posting data to OPC, Something got null and undefined";
          var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strDTId + ":";
          logError = logError + msg;
          //commented by vivek on 15-08-2020*********************************** */
          //ErrorLog.error(logError);
          ErrorLog.addToErrorLog(logError);
          //******************************************************************* */
        } else {
          console.log('Data posted to OPC', body);
          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strDTId + " : OPC Data posted successfully" + body;
          //commented by vivek on 18-08-2020********************************
          //logFromPC.info(logQ);
          // logFromPC.addtoProtocolLog(logQ)
          //************************************************************** */
        }
      }
    });
  }
  async exportToOPC_TDT(strTDTId, objBalValues) {
    var arrBal = [];
    var strTagName= "GOAUVIIB_TappedDensity.";
    arrBal.push({ "id": strTagName + strTDTId + ".TestName", "v": objBalValues.TestName });
    arrBal.push({ "id": strTagName + strTDTId + ".ProductName", "v": objBalValues.ProductName });
    // arrBal.push({ "id"PTGUII_TappedDensity_Vern." + strVernierId + ".Date", "v": objBalValues.strDate });
    arrBal.push({ "id": strTagName + strTDTId + ".TestStart", "v": objBalValues.TestStart });
    arrBal.push({ "id": strTagName + strTDTId + ".QuantityOfSample", "v": objBalValues.QuantityOfSample });
    arrBal.push({ "id": strTagName + strTDTId + ".BatchNo", "v": objBalValues.BatchNo });
    arrBal.push({ "id": strTagName + strTDTId + ".TestResult", "v": objBalValues.TestResult });
    arrBal.push({ "id": strTagName + strTDTId + ".TestEnd", "v": objBalValues.TestEnd });
    arrBal.push({ "id": strTagName + strTDTId + ".Lot", "v": objBalValues.Lot });
    arrBal.push({ "id": strTagName + strTDTId + ".Volumeoccupied(Vo)", "v": objBalValues.VolumeOccupiedVo });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".maximum_indi", "v": objBalValues.intMaximumInd });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".minimum_indi", "v": objBalValues.intMinimumInd });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".average_indi", "v": objBalValues.intAverage });
    arrBal.push({ "id": strTagName + strTDTId + ".TappedDensity", "v": objBalValues.TappedDensity });
    arrBal.push({ "id": strTagName + strTDTId + ".Tappedvolume(V10)", "v": objBalValues.TappedvolumeV10 });
    arrBal.push({ "id": strTagName + strTDTId + ".Tappedvolume(V500)", "v": objBalValues.TappedvolumeV500 });
    arrBal.push({ "id": strTagName + strTDTId + ".Tappedvolume(V1250a)", "v": objBalValues.TappedvolumeV1250a });
    arrBal.push({ "id": strTagName + strTDTId + ".Tappedvolume(V1250b)", "v": objBalValues.TappedvolumeV1250b });
    arrBal.push({ "id": strTagName + strTDTId + ".Tappedvolume(V1250c)", "v": objBalValues.TappedvolumeV1250c });
    arrBal.push({ "id": strTagName + strTDTId + ".Method", "v": objBalValues.Method });
    arrBal.push({ "id": strTagName + strTDTId + ".Layer", "v": objBalValues.Layer });

    console.log(arrBal)
    // objBalValues.intValue.forEach((value,i) => {
    //     arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".value" + i+1 , "v": value });
    // });

    // request.post({ url:OPCURL , form: arrBal }, function (err, httpResponse, body) { 
    //     if (err) {
    //         console.log(err);
    //     } else { 
    //         console.log(body);
    //     }
    // })


    request({
      url: OPCURL,
      method: 'POST',
      body: arrBal,
      json: true
    }, function (err, response, body) {

      if (err) {
        console.log('Error while posting data to OPC', err)
        //   let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : " + err;
        var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strTDTId + ":";
        logError = logError + err.stack;
        //commented by vivek on 15-08-2020*********************************** */
        //ErrorLog.error(logError);
        ErrorLog.addToErrorLog(logError);
        //******************************************************************* */
      } else {
        if (body == null || body == undefined) {
          console.log('Error while posting data to OPC, Something got null and undefined');
          let msg = "Error while posting data to OPC, Something got null and undefined";
          var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strTDTId + ":";
          logError = logError + msg;
          //commented by vivek on 15-08-2020*********************************** */
          //ErrorLog.error(logError);
          ErrorLog.addToErrorLog(logError);
          //******************************************************************* */
        } else {
          console.log('Data posted to OPC', body);
          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strTDTId + " : OPC Data posted successfully" + body;
          //commented by vivek on 18-08-2020********************************
          //logFromPC.info(logQ);
          // logFromPC.addtoProtocolLog(logQ)
          //************************************************************** */
        }
      }
    });
  }
  async exportToOPC_SS(strSSTId, objBalValues) {
    var arrBal = [];
    var strTagName= "GOAUVIIB_SieveShaker.";
    arrBal.push({ "id": strTagName + strSSTId + ".%FineAbove100Mesh", "v": objBalValues.QuantityAbove100Mesh });
    arrBal.push({ "id": strTagName + strSSTId + ".%FineAbove20Mesh", "v": objBalValues.perFineAbove20Mesh });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".Date", "v": objBalValues.strDate });
    arrBal.push({ "id": strTagName + strSSTId + ".%FineAbove40Mesh", "v": objBalValues.PerFineAbove40Mesh });
    arrBal.push({ "id": strTagName + strSSTId + ".%FineAbove60Mesh", "v": objBalValues.PerFineAbove60Mesh });
    arrBal.push({ "id": strTagName + strSSTId + ".%FineAbove80Mesh", "v": objBalValues.PerFineAbove80Mesh });
    arrBal.push({ "id": strTagName + strSSTId + ".%FineOnTheColectngtray", "v": objBalValues.PerFineOnTheColectngtray });
    arrBal.push({ "id": strTagName + strSSTId + ".Act%Fine", "v": objBalValues.PerFine });
    arrBal.push({ "id": strTagName + strSSTId + ".BatchNo", "v": objBalValues.BatchNo });
    arrBal.push({ "id": strTagName + strSSTId + ".FinesOnTheColectngtray", "v": objBalValues.finesOnTheColectngtray });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".maximum_indi", "v": objBalValues.intMaximumInd });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".minimum_indi", "v": objBalValues.intMinimumInd });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".average_indi", "v": objBalValues.intAverage });
    arrBal.push({ "id": strTagName + strSSTId + ".Lot", "v": objBalValues.Lot });
    arrBal.push({ "id": strTagName + strSSTId + ".ProductName", "v": objBalValues.ProductName });
    arrBal.push({ "id": strTagName + strSSTId + ".QuantityAbove100Mesh", "v": objBalValues.QuantityAbove100Mesh });
    arrBal.push({ "id": strTagName + strSSTId + ".QuantityAbove20Mesh", "v": objBalValues.QuantityAbove20Mesh });
    arrBal.push({ "id": strTagName + strSSTId + ".QuantityAbove40Mesh", "v": objBalValues.QuantityAbove40Mesh });
    arrBal.push({ "id": strTagName + strSSTId + ".QuantityAbove60Mesh", "v": objBalValues.QuantityAbove60Mesh });
    arrBal.push({ "id": strTagName + strSSTId + ".QuantityAbove80Mesh", "v": objBalValues.QuantityAbove80Mesh });
    arrBal.push({ "id": strTagName + strSSTId + ".QuantityOfSample", "v": objBalValues.QuantityOfSample });
    arrBal.push({ "id": strTagName + strSSTId + ".TestName", "v": objBalValues.TestName });
    arrBal.push({ "id": strTagName + strSSTId + ".TestResult", "v": objBalValues.TestResult });
    arrBal.push({ "id": strTagName + strSSTId + ".TestSample%Fine", "v": objBalValues.TestSamplePerFine });
    arrBal.push({ "id": strTagName + strSSTId + ".TestStart", "v": objBalValues.TestStart });

    console.log(arrBal)
    // objBalValues.intValue.forEach((value,i) => {
    //     arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".value" + i+1 , "v": value });
    // });

    // request.post({ url:OPCURL , form: arrBal }, function (err, httpResponse, body) { 
    //     if (err) {
    //         console.log(err);
    //     } else { 
    //         console.log(body);
    //     }
    // })


    request({
      url: OPCURL,
      method: 'POST',
      body: arrBal,
      json: true
    }, function (err, response, body) {

      if (err) {
        console.log('Error while posting data to OPC', err)
        //   let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : " + err;
        var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strSSTId + ":";
        logError = logError + err.stack;
        //commented by vivek on 15-08-2020*********************************** */
        //ErrorLog.error(logError);
        ErrorLog.addToErrorLog(logError);
        //******************************************************************* */
      } else {
        if (body == null || body == undefined) {
          console.log('Error while posting data to OPC, Something got null and undefined');
          let msg = "Error while posting data to OPC, Something got null and undefined";
          var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strSSTId + ":";
          logError = logError + msg;
          //commented by vivek on 15-08-2020*********************************** */
          //ErrorLog.error(logError);
          ErrorLog.addToErrorLog(logError);
          //******************************************************************* */
        } else {
          console.log('Data posted to OPC', body);
          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strSSTId + " : OPC Data posted successfully" + body;
          //commented by vivek on 18-08-2020********************************
          //logFromPC.info(logQ);
          // logFromPC.addtoProtocolLog(logQ)
          //************************************************************** */
        }
      }
    });
  }
  async exportToOPC_Friability(strId, objBalValues) {
    var arrBal = [];
    var strTagName= "GOAUVIIB_Friabilator.";
    arrBal.push({ "id": strTagName + strId + ".ActFriability%LHS", "v": objBalValues.ActFriabilityLHS });
    arrBal.push({ "id": strTagName + strId + ".ActFriability%RHS", "v": objBalValues.ActFriabilityRHS });
    arrBal.push({ "id": strTagName + strId + ".ActualCount", "v": objBalValues.ActualCount });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".Date", "v": objBalValues.strDate });
    arrBal.push({ "id": strTagName + strId + ".ActualRpm", "v": objBalValues.ActualRpm });
    arrBal.push({ "id": strTagName + strId + ".BatchNo", "v": objBalValues.BatchNo });
    arrBal.push({ "id": strTagName + strId + ".Lot", "v": objBalValues.Lot });
    arrBal.push({ "id": strTagName + strId + ".NoOfSample", "v": objBalValues.NoOfSample });
    arrBal.push({ "id": strTagName + strId + ".ProductName", "v": objBalValues.ProductName });
    arrBal.push({ "id": strTagName + strId + ".Side", "v": objBalValues.Side });
    arrBal.push({ "id": strTagName + strId + ".TestEnd", "v": objBalValues.TestEnd });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".maximum_indi", "v": objBalValues.intMaximumInd });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".minimum_indi", "v": objBalValues.intMinimumInd });
    // arrBal.push({ "id": "PTGUII_Vern." + strVernierId + ".average_indi", "v": objBalValues.intAverage });
    arrBal.push({ "id": strTagName + strId + ".TestName", "v": objBalValues.TestName });
    arrBal.push({ "id": strTagName + strId + ".TestResult", "v": objBalValues.TestResult });
    arrBal.push({ "id": strTagName + strId + ".TestStart", "v": objBalValues.TestStart });
    arrBal.push({ "id": strTagName + strId + ".WeightAfterTestLHS", "v": objBalValues.WeightAfterTestLHS });
    arrBal.push({ "id": strTagName + strId + ".WeightBeforeTestLHS", "v": objBalValues.WeightBeforeTestLHS });
    arrBal.push({ "id": strTagName + strId + ".WeightAfterTestRHS", "v": objBalValues.WeightAfterTestRHS });
    arrBal.push({ "id": strTagName + strId + ".WeightBeforeTestRHS", "v": objBalValues.WeightBeforeTestRHS });

    console.log(arrBal)
    // objBalValues.intValue.forEach((value,i) => {
    //     arrBal.push({ "id": "PTGUII_Bal." + strBalanceId + ".value" + i+1 , "v": value });
    // });

    // request.post({ url:OPCURL , form: arrBal }, function (err, httpResponse, body) { 
    //     if (err) {
    //         console.log(err);
    //     } else { 
    //         console.log(body);
    //     }
    // })


    request({
      url: OPCURL,
      method: 'POST',
      body: arrBal,
      json: true
    }, function (err, response, body) {

      if (err) {
        console.log('Error while posting data to OPC', err)
        //   let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : " + err;
        var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strId + ":";
        logError = logError + err.stack;
        //commented by vivek on 15-08-2020*********************************** */
        //ErrorLog.error(logError);
        ErrorLog.addToErrorLog(logError);
        //******************************************************************* */
      } else {
        if (body == null || body == undefined) {
          console.log('Error while posting data to OPC, Something got null and undefined');
          let msg = "Error while posting data to OPC, Something got null and undefined";
          var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strId + ":";
          logError = logError + msg;
          //commented by vivek on 15-08-2020*********************************** */
          //ErrorLog.error(logError);
          ErrorLog.addToErrorLog(logError);
          //******************************************************************* */
        } else {
          console.log('Data posted to OPC', body);
          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strId + " : OPC Data posted successfully" + body;
          //commented by vivek on 18-08-2020********************************
          //logFromPC.info(logQ);
          // logFromPC.addtoProtocolLog(logQ)
          //************************************************************** */
        }
      }
    });
  }
  async exportToOPC_Differential(strBalanceId, objBalValues) {
    var arrBal = [];
    // var strTagName= "GOAUVIIB_Balance.";
    // arrBal.push({ "id": strTagName + strBalanceId + ".TestName", "v": objBalValues.TestName });
    // arrBal.push({ "id": strTagName + strBalanceId + ".ProductName", "v": objBalValues.ProductName });
    // arrBal.push({ "id": strTagName + strBalanceId + ".TestStart", "v": objBalValues.TestStart });
    // arrBal.push({ "id": strTagName + strBalanceId + ".NoOfSample_DiffWt", "v": objBalValues.NoOfSample_DiffWt });
    // arrBal.push({ "id": strTagName + strBalanceId + ".BatchNo", "v": objBalValues.BatchNo });
    // arrBal.push({ "id": strTagName + strBalanceId + ".Side", "v": objBalValues.Side });
    // arrBal.push({ "id": strTagName + strBalanceId + ".ActMaximumNetWeight", "v": objBalValues.ActMaximumNetWeight });
    // arrBal.push({ "id": strTagName + strBalanceId + ".ActMinimumNetWeight", "v": objBalValues.ActMinimumNetWeight });
    // arrBal.push({ "id": strTagName + strBalanceId + ".AverageNetWeight", "v": objBalValues.AverageNetWeight });
    // arrBal.push({ "id": strTagName + strBalanceId + ".TestResult_DiffWtVariation", "v": objBalValues.TestResult_DiffWtVariation });
    // arrBal.push({ "id": strTagName + strBalanceId + ".TestEnd", "v": objBalValues.TestEnd });
    // arrBal.push({ "id": strTagName + strBalanceId + ".Lot", "v": objBalValues.Lot });
    // console.log(arrBal)
    var strTagName= "GOAUVIIB_Balance.";
    arrBal.push({ "id": strTagName + strBalanceId + ".TestName", "v": objBalValues.TestName });
    arrBal.push({ "id": strTagName + strBalanceId + ".ProductName", "v": objBalValues.ProductName });
    arrBal.push({ "id": strTagName + strBalanceId + ".TestStart", "v": objBalValues.TestStart });
    arrBal.push({ "id": strTagName + strBalanceId + ".NoOfSample_GrpWt", "v": 0 });
    arrBal.push({ "id": strTagName + strBalanceId + ".NoOfSample_IndiWt", "v": 0 });
    arrBal.push({ "id": strTagName + strBalanceId + ".NoOfSample_DiffWt", "v": objBalValues.NoOfSample_DiffWt });
    arrBal.push({ "id": strTagName + strBalanceId + ".BatchNo", "v": objBalValues.BatchNo });
    arrBal.push({ "id": strTagName + strBalanceId + ".Side", "v": objBalValues.Side });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMaximumGrpWeight", "v": 0 });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMinimumGrpWeight", "v": 0 });
    arrBal.push({ "id": strTagName + strBalanceId + ".AverageGrpWeight", "v": 0 });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMaximumIndiWeight", "v": 0 });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMinimumIndiWeight", "v": 0 });
    arrBal.push({ "id": strTagName + strBalanceId + ".AverageIndiWeight", "v": 0 });
    arrBal.push({ "id": strTagName + strBalanceId + ".TestResult_GrpWtVariation", "v": false });
    arrBal.push({ "id": strTagName + strBalanceId + ".TestResult_IndiWtVariation", "v": false });
    arrBal.push({ "id": strTagName + strBalanceId + ".TestEnd", "v": objBalValues.TestEnd });
    arrBal.push({ "id": strTagName + strBalanceId + ".Lot", "v": objBalValues.Lot });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMaximumNetWeight", "v": objBalValues.ActMaximumNetWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".ActMinimumNetWeight", "v": objBalValues.ActMinimumNetWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".AverageNetWeight", "v": objBalValues.AverageNetWeight });
    arrBal.push({ "id": strTagName + strBalanceId + ".TestResult_DiffWtVariation", "v": objBalValues.TestResult_DiffWtVariation });
    console.log(arrBal)




    request({
      url: OPCURL,
      method: 'POST',
      body: arrBal,
      json: true
    }, function (err, response, body) {

      if (err) {
        console.log('Error while posting data to OPC', err)
        //   let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : " + err;
        var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strBalanceId + ":Body:"+arrBal;
        logError = logError + err.stack;
        //commented by vivek on 15-08-2020*********************************** */
        //ErrorLog.error(logError);
        ErrorLog.addToErrorLog(logError);
        //******************************************************************* */
      } else {
        if (body == null || body == undefined) {
          console.log('Error while posting data to OPC, Something got null and undefined');
          let msg = "Error while posting data to OPC, Something got null and undefined";
          var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + strBalanceId + ": Body:"+arrBal;
          logError = logError + msg;
          //commented by vivek on 15-08-2020*********************************** */
          //ErrorLog.error(logError);
          ErrorLog.addToErrorLog(logError);
          //******************************************************************* */
        } else {
          console.log('Data posted to OPC', body);
          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + strBalanceId + " : OPC Data posted successfully" + body;
          //commented by vivek on 18-08-2020********************************
          //logFromPC.info(logQ);
          // logFromPC.addtoProtocolLog(logQ)
          //************************************************************** */
        }
      }
    });
  }
}

module.exports = OPC;