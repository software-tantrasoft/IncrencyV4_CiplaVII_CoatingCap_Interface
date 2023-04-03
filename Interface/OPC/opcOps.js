const OPC = require('./opc.model')
const objOPC = new OPC();
const BalanceOPCInterface = require('../OPC/opc.interface');
const Database = require('../../database/clsQueryProcess');
const database = new Database();
const globalData = require('../../global/globalData');
const FormulaFun = require('../Product/clsformulaFun');
const dbCon = require('../../utils/dbCon');
const formulaFun = new FormulaFun();
const date = require('date-and-time');
// var Tracker = require('../clsTracker');
const timeConverter = require('../../middleware/setTimeZone');

class OPCOperations {
   async Balance(typeValue, result, ResultOfReport,ProductType,dp) {
      try {
         var strTest = '';
         switch (typeValue) {
            case '1':
               strTest = "Individual";
               break;
            case '8':
               strTest = "Individual Layer 1";
               break;
            case 'L':
               strTest = "Individual Layer 2";
               break;
         }
         const IBalanceOPC = new BalanceOPCInterface();
         IBalanceOPC.BalanceTags.TestName = strTest;
         IBalanceOPC.BalanceTags.ProductName = result.incompleteData.ProductName;
         // IBalanceOPC.BalanceTags.strDate = result.incompleteData.PrDate;
         IBalanceOPC.BalanceTags.TestStart = await timeConverter.convertDate(result.incompleteData.PrDate, "DD-MM-YYYY") + " " + result.incompleteData.PrTime;
         IBalanceOPC.BalanceTags.NoOfSample_IndiWt = result.incompleteData.Qty;
         IBalanceOPC.BalanceTags.BatchNo = result.incompleteData.BatchNo;
         IBalanceOPC.BalanceTags.Side = result.incompleteData.Side;

         const values = [];
         var Result = true;
         var aboveBelowT1 = 0;
         // var sum = 0;
         for (const val of result.detailData) {
            values.push(parseFloat(val.DataValue));
         }
         if (ResultOfReport != 'LE0') {
            Result = false;
         }

         let sum = values.reduce((previous, current) => current += previous);
         let avg = sum / values.length;

         IBalanceOPC.BalanceTags.ActMaximumIndiWeight = Math.max(...values);
         IBalanceOPC.BalanceTags.ActMinimumIndiWeight = Math.min(...values);
         IBalanceOPC.BalanceTags.AverageIndiWeight = avg.toFixed(dp);
         IBalanceOPC.BalanceTags.TestResult_IndiWtVariation = Result;
         //IBalanceOPC.BalanceTags.intValue = values;
         IBalanceOPC.BalanceTags.TestEnd = await timeConverter.convertDate(result.incompleteData.PrEndDate, "DD-MM-YYYY") + " " + result.incompleteData.PrEndTime;
         IBalanceOPC.BalanceTags.Lot = result.incompleteData.Lot;
         
         if(ProductType == '1'){
            objOPC.exportToOPC_Balance(result.incompleteData.BalanceId, IBalanceOPC.BalanceTags);
         }else{
            objOPC.exportToOPC_BalanceCap(result.incompleteData.BalanceId, IBalanceOPC.BalanceTags);
         }
         //result.incompleteData.BalanceId
         // objOPC.exportToOPC_Balance(result.incompleteData.BalanceId, IBalanceOPC.BalanceTags,ProductType);

      } catch (err) {
         throw new Error(err);
      }
   }
   async BalanceGRP(typeValue, MasterRepSrNo, SqNo, ResultOfReport,ProductType,dp) {
      // console.log(MasterRepSrNo)
      //commented by vivek on 18-08-2020********************************
      //Tracker.info(`${date.format(new Date(), 'DD-MM-YYYY HH:mm:ss')} ${typeValue} -> in OPC function (Balance Group)`);
      // Tracker.addtoTrackerLog(`${date.format(new Date(), 'DD-MM-YYYY HH:mm:ss')} ${typeValue} -> in OPC function (Balance Group)`)
      //************************************************************** */
      try {
         if(ProductType == '1'){
         var strTest = '';
         var masterTable = 'tbl_tab_master2';
         var detailTable = 'tbl_tab_detail2';
         if (typeValue == 2) {
            masterTable = 'tbl_tab_master2';
            detailTable = 'tbl_tab_detail2';
            strTest = "Group";
         } else if (typeValue == 10) {
            masterTable = 'tbl_tab_master10';
            detailTable = 'tbl_tab_detail10';
            strTest = "Group Layer 1";
         } else if (typeValue == 12) {
            masterTable = 'tbl_tab_master12';
            detailTable = 'tbl_tab_detail12';
            strTest = "Group Layer 2";
         }
         let selectMasterObj = {
            str_tableName: masterTable,
            data: '*',
            condition: [
               { str_colName: 'RepSerNo', value: MasterRepSrNo, comp: 'eq' },
            ]
         }
         let detailObj = {
            str_tableName: detailTable,
            data: '*',
            condition: [
               { str_colName: 'RecNo', value: SqNo, comp: 'eq' },
            ]
         }
         var resMst = await database.select(selectMasterObj);
         var resDet = await database.select(detailObj);
         const IBalanceOPC = new BalanceOPCInterface();
         IBalanceOPC.BalanceTags.TestName = strTest;
         IBalanceOPC.BalanceTags.ProductName = resMst[0][0].ProductName;
         // IBalanceOPC.BalanceTags.strDate = resDet[0][0].PrDate;

         IBalanceOPC.BalanceTags.TestStart = `${await timeConverter.convertDate(resMst[0][0].PrDate, "DD-MM-YYYY")} ${resDet[0][0].PrTime}`;
         IBalanceOPC.BalanceTags.NoOfSample_GrpWt = resMst[0][0].GrpQty;
         IBalanceOPC.BalanceTags.BatchNo = resMst[0][0].BatchNo;
         IBalanceOPC.BalanceTags.Side = resDet[0][0].Side;

         const values = [];
         var Result = true;
         var aboveBelowT1 = 0;
         // var sum = 0;
         for (const val of resDet[0]) {
            values.push(parseFloat(val.DataValue));
         }
         if (ResultOfReport != 'LE0') {
            Result = false;
         }
         let sum = values.reduce((previous, current) => current += previous);
         let avg = sum / values.length;

         IBalanceOPC.BalanceTags.ActMaximumGrpWeight = Math.max(...values);
         IBalanceOPC.BalanceTags.ActMinimumGrpWeight = Math.min(...values);
         IBalanceOPC.BalanceTags.AverageGrpWeight = avg;
         IBalanceOPC.BalanceTags.TestResult_GrpWtVariation = Result;
         //IBalanceOPC.BalanceTags.intValue = values;
         IBalanceOPC.BalanceTags.TestEnd = `${await timeConverter.convertDate(resMst[0][0].PrEndDate, "DD-MM-YYYY")} ${resDet[0][0].PrTime}`;
         IBalanceOPC.BalanceTags.Lot = resMst[0][0].Lot;

         //result.incompleteData.BalanceId
         objOPC.exportToOPC_Balance(resDet[0][0].InstrumentName, IBalanceOPC.BalanceTags);
      }
      else{
         var strTest = '';
         var masterTable = 'tbl_cap_master2';
         var detailTable = 'tbl_cap_detail2';
         if (typeValue == 2) {
            masterTable = 'tbl_cap_master2';
            detailTable = 'tbl_cap_detail2';
            strTest = "Group";
         } else if (typeValue == 10) {
            masterTable = 'tbl_cap_master10';
            detailTable = 'tbl_cap_detail10';
            strTest = "Group Layer 1";
         } else if (typeValue == 12) {
            masterTable = 'tbl_cap_master12';
            detailTable = 'tbl_cap_detail12';
            strTest = "Group Layer 2";
         }
         let selectMasterObj = {
            str_tableName: masterTable,
            data: '*',
            condition: [
               { str_colName: 'RepSerNo', value: MasterRepSrNo, comp: 'eq' },
            ]
         }
         let detailObj = {
            str_tableName: detailTable,
            data: '*',
            condition: [
               { str_colName: 'RecNo', value: SqNo, comp: 'eq' },
            ]
         }
         var resMst = await database.select(selectMasterObj);
         var resDet = await database.select(detailObj);
         const IBalanceOPC = new BalanceOPCInterface();
         IBalanceOPC.BalanceTags.TestName = strTest;
         IBalanceOPC.BalanceTags.ProductName = resMst[0][0].ProductName;
         // IBalanceOPC.BalanceTags.strDate = resDet[0][0].PrDate;

         IBalanceOPC.BalanceTags.TestStart = `${await timeConverter.convertDate(resMst[0][0].PrDate, "DD-MM-YYYY")} ${resDet[0][0].PrTime}`;
         IBalanceOPC.BalanceTags.NoOfSample_GrpWt = resMst[0][0].GrpQty;
         IBalanceOPC.BalanceTags.BatchNo = resMst[0][0].BatchNo;
         IBalanceOPC.BalanceTags.Side = resDet[0][0].Side;

         const values = [];
         var Result = true;
         var aboveBelowT1 = 0;
         // var sum = 0;
         for (const val of resDet[0]) {
            values.push(parseFloat(val.DataValue));
         }
         if (ResultOfReport != 'LE0') {
            Result = false;
         }
         let sum = values.reduce((previous, current) => current += previous);
         let avg = sum / values.length;

         IBalanceOPC.BalanceTags.ActMaximumGrpWeight = Math.max(...values);
         IBalanceOPC.BalanceTags.ActMinimumGrpWeight = Math.min(...values);
         IBalanceOPC.BalanceTags.AverageGrpWeight = avg;
         IBalanceOPC.BalanceTags.TestResult_GrpWtVariation = Result;
         //IBalanceOPC.BalanceTags.intValue = values;
         IBalanceOPC.BalanceTags.TestEnd = `${await timeConverter.convertDate(resMst[0][0].PrEndDate, "DD-MM-YYYY")} ${resDet[0][0].PrTime}`;
         IBalanceOPC.BalanceTags.Lot = resMst[0][0].Lot;

         //result.incompleteData.BalanceId
         objOPC.exportToOPC_BalanceCap(resDet[0][0].InstrumentName, IBalanceOPC.BalanceTags);
      }
      } catch (err) {
         throw new Error(err);
      }
   }
   async Vernier(typeValue, result, ResultOfReport) {
      try {
         var strTest = '';

         const IVernierOPC = new BalanceOPCInterface();

         const values = [];
         var Result = true;
         var aboveBelowT1 = 0;
         // var sum = 0;
         for (const val of result.detailData) {
            values.push(parseFloat(val.DataValue));
         }
         if (ResultOfReport != 'LE0') {
            Result = false;
         }

         let sum = values.reduce((previous, current) => current += previous);
         let avg = sum / values.length;
         switch (typeValue) {
            case '3':
               strTest = "Thickness";
               IVernierOPC.VernierTags.ActMaximumThickness = Math.max(...values).toFixed(2);
               IVernierOPC.VernierTags.ActMinimumThickness = Math.min(...values).toFixed(2);
               IVernierOPC.VernierTags.AverageThickness = avg.toFixed(2)
               IVernierOPC.VernierTags.NoOfSample_Thickness = result.incompleteData.Qty;
               IVernierOPC.VernierTags.TestResult_Thickness = Result;
               break;
            case '4':
               strTest = "Bredth";
               IVernierOPC.VernierTags.ActMaximumBreadth = Math.max(...values).toFixed(2);
               IVernierOPC.VernierTags.ActMinimumBreadth = Math.min(...values).toFixed(2);
               IVernierOPC.VernierTags.AverageBreadth = avg.toFixed(2)
               IVernierOPC.VernierTags.NoOfSample_Breadth = result.incompleteData.Qty;
               IVernierOPC.VernierTags.TestResult_Breadth = Result;
               break;
            case '5':
               strTest = "Length";
               IVernierOPC.VernierTags.ActMaximumLength = Math.max(...values).toFixed(2);
               IVernierOPC.VernierTags.ActMinimumLength = Math.min(...values).toFixed(2);
               IVernierOPC.VernierTags.AverageLength = avg.toFixed(2)
               IVernierOPC.VernierTags.NoOfSample_Length = result.incompleteData.Qty;
               IVernierOPC.VernierTags.TestResult_Length = Result;
               break;
            case '6':
               strTest = "Diameter";
               IVernierOPC.VernierTags.ActMaximumDiameter = Math.max(...values).toFixed(2);
               IVernierOPC.VernierTags.ActMinimumDiameter = Math.min(...values).toFixed(2);
               IVernierOPC.VernierTags.AverageDiameter = avg.toFixed(2)
               IVernierOPC.VernierTags.NoOfSample_Diameter = result.incompleteData.Qty;
               IVernierOPC.VernierTags.TestResult_Diameter = Result;
               break;
         }
         IVernierOPC.VernierTags.TestName = strTest;
         IVernierOPC.VernierTags.ProductName = result.incompleteData.ProductName;
         // IVernierOPC.VernierTags.strDate = result.incompleteData.PrDate;
         IVernierOPC.VernierTags.TestStart = `${await timeConverter.convertDate(result.incompleteData.PrDate, "DD-MM-YYYY")} ${result.incompleteData.PrTime}`;
         IVernierOPC.VernierTags.BatchNo = result.incompleteData.BatchNo;
         IVernierOPC.VernierTags.Side = result.incompleteData.Side;
         //IBalanceOPC.BalanceTags.intValue = values;
         IVernierOPC.VernierTags.TestEnd = `${await timeConverter.convertDate(result.incompleteData.PrEndDate, "DD-MM-YYYY")} ${result.incompleteData.PrEndTime}`;
         IVernierOPC.VernierTags.Lot = result.incompleteData.Lot;

         //result.incompleteData.BalanceId
         objOPC.exportToOPC_Vernier(result.incompleteData.VernierId, IVernierOPC.VernierTags);

      } catch (err) {
         throw new Error(err);
      }
   }
   async Hardness(masterData, DetailData, idsNo) {
      try {
         var strTest = 'Hardness';
         var tempLimObj = globalData.arr_limits.find(k => k.idsNo == idsNo);
         let sumHT = 0;
         let sumT = 0;
         let sumDLB = 0;
         let arrHTDetail = [];
         let arrTDetail = [];
         let outFlagHTD = 0;
         let arrDLBDetail = [];
         let outFlagThickness = 0;
         let outFlagDOLOBO = 0;
         let remark;
         let remarkHardness = true;
         let remarkDiameter = true;
         let remarkLength = true;
         let remarkThickness = true;
         let maxHTDLimit = parseFloat(tempLimObj.Hardness.T1Pos);
         let minHTDLimit = parseFloat(tempLimObj.Hardness.T1Neg);
         if (tempLimObj.Thickness == undefined) {
            var maxTLimit = 0;
            var minTLimit = 0;
         } else {
            var maxTLimit = parseFloat(formulaFun.upperLimit(tempLimObj.Thickness));
            var minTLimit = parseFloat(formulaFun.lowerLimit(tempLimObj.Thickness));
         }

         // if(masterData.NomDOLOBO != 0) {
         if (masterData.ColHeadDOLOBO == 'NA') {
            var maxDLBLimit = 0;
            var minDLBLimit = 0;
         } else {
            if (tempLimObj.length == undefined && tempLimObj.Breadth == undefined && tempLimObj.Diameter == undefined) {
               var maxDLBLimit = 0;
               var minDLBLimit = 0;
            } else {
               var maxDLBLimit = parseFloat(formulaFun.upperLimit(tempLimObj[masterData.ColHeadDOLOBO]));
               var minDLBLimit = parseFloat(formulaFun.lowerLimit(tempLimObj[masterData.ColHeadDOLOBO]));
            }

         }


         let count = DetailData.length;
         for (var i = 0; i < DetailData.length; i++) {
            var dataValHard = parseFloat(DetailData[i].DataValueHard);
            if (isNaN(dataValHard)) { dataValHard = 0 }
            if ((minHTDLimit > dataValHard) || (dataValHard > maxHTDLimit)) {
               outFlagHTD = outFlagHTD + 1;
               remarkHardness = false;
            }
            arrHTDetail.push(dataValHard);
            var dataValThick = parseFloat(DetailData[i].DataValueThick);
            if (isNaN(dataValThick)) { dataValThick = 0 }
            if (minTLimit != 0 && maxTLimit != 0) {
               if ((minTLimit > dataValThick) || (dataValThick > maxTLimit)) {
                  outFlagThickness = outFlagThickness + 1;
                  remarkThickness = false;
               }
            }
            arrTDetail.push(dataValThick);
            var dataValDLB = parseFloat(DetailData[i].DataValueDOLOBO);
            if (isNaN(dataValDLB)) { dataValDLB = 0 }
            if (minDLBLimit != 0 && maxDLBLimit != 0) {
               if ((minDLBLimit > dataValDLB) || (dataValDLB > maxDLBLimit)) {
                  outFlagDOLOBO = outFlagDOLOBO + 1;
                  if (masterData.ColHeadDOLOBO == 'Diameter') {
                     remarkDiameter = false;

                  } else if (masterData.ColHeadDOLOBO == 'Length') {
                     remarkLength = false;
                  }
               }
            }
            arrDLBDetail.push(dataValDLB);
         }
         // if (masterData.NomDOLOBO != 0 && masterData.NegTolHard != 0 && masterData.NomThick) {
         //    if (outFlagHTD != 0 || outFlagThickness != 0 || outFlagDOLOBO != 0) {
         //       remark = 'Not Complies';
         //    } else {
         //       remark = 'Complies';
         //    }
         // } else if (masterData.NomDOLOBO == 0 && masterData.NegTolHard != 0 && masterData.NomThick != 0) {
         //    if (outFlagHTD != 0 || outFlagThickness != 0) {
         //       remark = 'Not Complies'
         //    } else {
         //       remark = 'Complies';
         //    }
         // } else if (masterData.NomDOLOBO != 0 && masterData.NegTolHard != 0 && masterData.NomThick == 0) {
         //    if (outFlagHTD != 0 || outFlagDOLOBO != 0) {
         //       remark = 'Not Complies'
         //    } else {
         //       remark = 'Complies';
         //    }
         // } else if (masterData.NomDOLOBO == 0 && masterData.NegTolHard != 0 && masterData.NomThick == 0) {
         //    if (outFlagHTD != 0) {
         //       remark = 'Not Complies'
         //    } else {
         //       remark = 'Complies';
         //    }
         // }
         for (var j = 0; j < arrHTDetail.length; j++) {
            sumHT = sumHT + parseFloat(arrHTDetail[j]);
         }
         for (var k = 0; k < arrTDetail.length; k++) {
            sumT = sumT + parseFloat(arrTDetail[k]);
         }
         for (var l = 0; l < arrDLBDetail.length; l++) {
            sumDLB = sumDLB + parseFloat(arrDLBDetail[l]);
         }
         var MaxHard = Math.max(...arrHTDetail);
         var MinHard = Math.min(...arrHTDetail);
         var avgHard = (sumHT / count);
         var MaxThick = Math.max(...arrTDetail);
         var MinThick = Math.min(...arrTDetail);
         var AvgThick = (sumT / count);
         var MaxDLB = Math.max(...arrDLBDetail);
         var MinDLB = Math.min(...arrDLBDetail);
         var AvgDLB = (sumDLB / count);
         const IHardnessOPC = new BalanceOPCInterface();
         if (masterData.ColHeadDOLOBO == 'Diameter') {
            IHardnessOPC.HTTags.ActMaximumDiameter = MaxDLB.toFixed(2);
            IHardnessOPC.HTTags.ActMinimumDiameter = MinDLB.toFixed(2);
            IHardnessOPC.HTTags.AverageDiameter = AvgDLB.toFixed(2);

         } else if (masterData.ColHeadDOLOBO == 'Length') {

            IHardnessOPC.HTTags.ActMaximumlength = MaxDLB.toFixed(2);
            IHardnessOPC.HTTags.ActMinimumlength = MinDLB.toFixed(2);
            IHardnessOPC.HTTags.Averagelength = AvgDLB.toFixed(2);
         }


         IHardnessOPC.HTTags.ActMaximumHardness = MaxHard.toFixed(0);
         // IVernierOPC.VernierTags.strDate = result.incompleteData.PrDate;

         IHardnessOPC.HTTags.ActMaximumThickness = MaxThick.toFixed(2);

         IHardnessOPC.HTTags.ActMinimumHardness = MinHard.toFixed(0);

         IHardnessOPC.HTTags.ActMinimumThickness = MinThick.toFixed(2);

         IHardnessOPC.HTTags.AverageHardness = avgHard.toFixed(0);
         //IBalanceOPC.BalanceTags.intValue = values;

         IHardnessOPC.HTTags.AverageThickness = AvgThick.toFixed(2);
         IHardnessOPC.HTTags.BatchNo = masterData.BatchNo;
         IHardnessOPC.HTTags.Lot = masterData.Lot;
         IHardnessOPC.HTTags.NoOfSample = masterData.Qty;
         //IBalanceOPC.BalanceTags.intValue = values;
         IHardnessOPC.HTTags.ProductName = masterData.ProductName;
         IHardnessOPC.HTTags.Side = masterData.Side;
         IHardnessOPC.HTTags.TestEnd = `${await timeConverter.convertDate(masterData.PrEndDate, "DD-MM-YYYY")} ${masterData.PrEndTime}`;
         IHardnessOPC.HTTags.TestName = strTest;
         IHardnessOPC.HTTags.TestResultDiameter = remarkDiameter;
         IHardnessOPC.HTTags.TestResultHardness = remarkHardness;
         IHardnessOPC.HTTags.TestResultlength = remarkLength;
         IHardnessOPC.HTTags.TestResultThickness = remarkThickness;
         IHardnessOPC.HTTags.TestStart = `${await timeConverter.convertDate(masterData.PrDate, "DD-MM-YYYY")} ${masterData.PrTime}`;

         //result.incompleteData.BalanceId
         objOPC.exportToOPC_MultiParamHardness(masterData.HardnessID, IHardnessOPC.HTTags);

      } catch (err) {
         throw new Error(err);
      }
   }
   async MoistAnalizer(maxRepNo) {
      try {
         var LOD = await dbCon.execute(`SELECT ROUND(CAST((((DryWt-LossOnWt)/DryWt)*100) AS DECIMAL(20,15)),2) AS lodPer,ROUND(CAST(minLimit AS DECIMAL(20,15)),2)  AS MINWT,ROUND(CAST(maxLimit AS DECIMAL(20,15)),2) AS MAXWT FROM tbl_lodmaster WHERE RepSerNo=${maxRepNo}`);
         // selecting MA data 
         let resultRemark = 'Pass';
         if (LOD[0][0].MINWT < LOD[0][0].lodPer && LOD[0][0].lodPer <= LOD[0][0].MAXWT) {
            resultRemark = true;
         } else {
            resultRemark = false;
         }
         var objSelectData = {
            str_tableName: 'tbl_lodmaster',
            data: '*',
            condition: [
               { str_colName: 'RepSerNo', value: maxRepNo }
            ]
         }
         let masterData = await database.select(objSelectData);
         masterData = masterData[0][0];
         var strTest = 'Moisture Analyzer';
         const IMAOPC = new BalanceOPCInterface();
         IMAOPC.MATags.BatchNo = masterData.BatchNo;
         IMAOPC.MATags.TestStart = `${await timeConverter.convertDate(masterData.PrDate, "DD-MM-YYYY")} ${masterData.PrTime}`;
         // IVernierOPC.VernierTags.strDate = result.incompleteData.PrDate;
         IMAOPC.MATags.SetDryingTemp = masterData.SetTemp;
         IMAOPC.MATags.TestEnd = `${await timeConverter.convertDate(masterData.PrEndDate, "DD-MM-YYYY")} ${masterData.PrEndTime}`;
         IMAOPC.MATags.FinalWeight = parseFloat(masterData.LossOnWt).toFixed(3);
         IMAOPC.MATags.Layer = masterData.Layer;
         IMAOPC.MATags.ActLossOnDrying = parseFloat(LOD[0][0].lodPer).toFixed(2)//(parseFloat(masterData.DryWt) - parseFloat(masterData.LossOnWt)).toFixed(3);
         IMAOPC.MATags.Lot = masterData.Lot;
         IMAOPC.MATags.ProdName = masterData.ProductName;
         IMAOPC.MATags.TestResult = resultRemark;
         //IBalanceOPC.BalanceTags.intValue = values;
         IMAOPC.MATags.Stage = masterData.Stage;
         IMAOPC.MATags.StartWeight = parseFloat(masterData.DryWt).toFixed(3);
         IMAOPC.MATags.TestName = strTest;
         //result.incompleteData.BalanceId
         objOPC.exportToOPC_MA(masterData.LODID, IMAOPC.MATags);

      } catch (err) {
         throw new Error(err);
      }
   }
   async DT(InsertIdLHS = 0, InsertIdRHS = 0, selectedcubicalObj, idsNo, le,ProductType) {
      try {
         if(ProductType == '1'){
         var MaxTimeLHS = "";
         var MaxTimeRHS = "";
         var testEndTime = "";
         var result = false;
         if (le.substring(2, 3) == '1') {
            result = true;
         } else {
            result = false
         }
         if (selectedcubicalObj.Sys_RotaryType == 'Double') {
            var masterResult = await dbCon.execute(`SELECT * FROM tbl_tab_master13 WHERE RepSerNo='${InsertIdLHS}' OR RepSerNo='${InsertIdRHS}'`);
            var lhsDet = await dbCon.execute(`SELECT DT_StartTm,DT_StartDate,MAX(DT_RunTime) AS 'Max', MIN(DT_RunTime) AS 'Min', TIME_FORMAT(SEC_TO_TIME(AVG(HOUR(DT_RunTime) * 3600 +
            (MINUTE(DT_RunTime) * 60) + SECOND(DT_RunTime))),'%H:%i:%s') AS 'Avg' FROM tbl_tab_detail13 WHERE RepSerNo='${InsertIdLHS}'`);
            var rhsDet = await dbCon.execute(`SELECT DT_StartTm,DT_StartDate,MAX(DT_RunTime) AS 'Max', MIN(DT_RunTime) AS 'Min', TIME_FORMAT(SEC_TO_TIME(AVG(HOUR(DT_RunTime) * 3600 +
            (MINUTE(DT_RunTime) * 60) + SECOND(DT_RunTime))),'%H:%i:%s') AS 'Avg' FROM tbl_tab_detail13 WHERE RepSerNo='${InsertIdRHS}'`);
            MaxTimeLHS = lhsDet[0][0].Max;
            MaxTimeRHS = rhsDet[0][0].Max;
         } else {
            var masterResult = await dbCon.execute(`SELECT * FROM tbl_tab_master13 WHERE RepSerNo='${InsertIdLHS}'`);
            var lhsDet = await dbCon.execute(`SELECT DT_StartTm,DT_StartDate,MAX(DT_RunTime) AS 'Max', MIN(DT_RunTime) AS 'Min', TIME_FORMAT(SEC_TO_TIME(AVG(HOUR(DT_RunTime) * 3600 +
            (MINUTE(DT_RunTime) * 60) + SECOND(DT_RunTime))),'%H:%i:%s') AS 'Avg' FROM tbl_tab_detail13 WHERE RepSerNo='${InsertIdLHS}'`);
            MaxTimeLHS = lhsDet[0][0].Max;
            MaxTimeRHS = "";
         }
         var strTest = 'Disintegration Testing';
         const IDTOPC = new BalanceOPCInterface();
         IDTOPC.DTTags.BatchNo = masterResult[0][0].BatchNo;
         IDTOPC.DTTags.TestStart = `${await timeConverter.convertDate(lhsDet[0][0].DT_StartDate, "DD-MM-YYYY")} ${lhsDet[0][0].DT_StartTm}`;
         // IVernierOPC.VernierTags.strDate = result.incompleteData.PrDate;
         console.log()
         testEndTime = await timeConverter.addMinutes(IDTOPC.DTTags.TestStart, lhsDet[0][0].Max);
         IDTOPC.DTTags.TestEnd = testEndTime;

         IDTOPC.DTTags.Lot = masterResult[0][0].Lot;
         IDTOPC.DTTags.ActMaximumTemp = parseFloat(masterResult[0][0].MaxTemp);
         IDTOPC.DTTags.ActMaxTimeLHS = MaxTimeLHS;
         IDTOPC.DTTags.ActMaxTimeRHS = MaxTimeRHS;
         IDTOPC.DTTags.ActMinimumTemp = parseFloat(masterResult[0][0].MinTemp);
         IDTOPC.DTTags.NoOfSample = masterResult[0][0].Qty;
         IDTOPC.DTTags.ProductName = masterResult[0][0].ProductName;
         //IBalanceOPC.BalanceTags.intValue = values;
         IDTOPC.DTTags.TestResult = result;
         IDTOPC.DTTags.Side = masterResult[0][0].Side;
         IDTOPC.DTTags.TestName = strTest;
         //result.incompleteData.BalanceId
         objOPC.exportToOPC_DT(masterResult[0][0].DTID, IDTOPC.DTTags);
      }
         else{
               var MaxTimeLHS = "";
               var MaxTimeRHS = "";
               var testEndTime = "";
               var result = false;
               if (le.substring(2, 3) == '1') {
                  result = true;
               } else {
                  result = false
               }
               if (selectedcubicalObj.Sys_RotaryType == 'Double') {
                  var masterResult = await dbCon.execute(`SELECT * FROM tbl_cap_master6 WHERE RepSerNo='${InsertIdLHS}' OR RepSerNo='${InsertIdRHS}'`);
                  var lhsDet = await dbCon.execute(`SELECT DT_StartTm,DT_StartDate,MAX(DT_RunTime) AS 'Max', MIN(DT_RunTime) AS 'Min', TIME_FORMAT(SEC_TO_TIME(AVG(HOUR(DT_RunTime) * 3600 +
                  (MINUTE(DT_RunTime) * 60) + SECOND(DT_RunTime))),'%H:%i:%s') AS 'Avg' FROM tbl_tab_detail13 WHERE RepSerNo='${InsertIdLHS}'`);
                  var rhsDet = await dbCon.execute(`SELECT DT_StartTm,DT_StartDate,MAX(DT_RunTime) AS 'Max', MIN(DT_RunTime) AS 'Min', TIME_FORMAT(SEC_TO_TIME(AVG(HOUR(DT_RunTime) * 3600 +
                  (MINUTE(DT_RunTime) * 60) + SECOND(DT_RunTime))),'%H:%i:%s') AS 'Avg' FROM tbl_cap_detail6 WHERE RepSerNo='${InsertIdRHS}'`);
                  MaxTimeLHS = lhsDet[0][0].Max;
                  MaxTimeRHS = rhsDet[0][0].Max;
               } else {
                  var masterResult = await dbCon.execute(`SELECT * FROM tbl_cap_master6 WHERE RepSerNo='${InsertIdLHS}'`);
                  var lhsDet = await dbCon.execute(`SELECT DT_StartTm,DT_StartDate,MAX(DT_RunTime) AS 'Max', MIN(DT_RunTime) AS 'Min', TIME_FORMAT(SEC_TO_TIME(AVG(HOUR(DT_RunTime) * 3600 +
                  (MINUTE(DT_RunTime) * 60) + SECOND(DT_RunTime))),'%H:%i:%s') AS 'Avg' FROM tbl_cap_detail6 WHERE RepSerNo='${InsertIdLHS}'`);
                  MaxTimeLHS = lhsDet[0][0].Max;
                  MaxTimeRHS = "";
               }
               var strTest = 'Disintegration Testing';
               const IDTOPC = new BalanceOPCInterface();
               IDTOPC.DTTags.BatchNo = masterResult[0][0].BatchNo;
               IDTOPC.DTTags.TestStart = `${await timeConverter.convertDate(lhsDet[0][0].DT_StartDate, "DD-MM-YYYY")} ${lhsDet[0][0].DT_StartTm}`;
               // IVernierOPC.VernierTags.strDate = result.incompleteData.PrDate;
               testEndTime = await timeConverter.addMinutes(IDTOPC.DTTags.TestStart, lhsDet[0][0].Max);
               IDTOPC.DTTags.TestEnd = testEndTime;
      
               IDTOPC.DTTags.Lot = masterResult[0][0].Lot;
               IDTOPC.DTTags.ActMaximumTemp = parseFloat(masterResult[0][0].MaxTemp);
               IDTOPC.DTTags.ActMaxTimeLHS = MaxTimeLHS;
               IDTOPC.DTTags.ActMaxTimeRHS = MaxTimeRHS;
               IDTOPC.DTTags.ActMinimumTemp = parseFloat(masterResult[0][0].MinTemp);
               IDTOPC.DTTags.NoOfSample = masterResult[0][0].Qty;
               IDTOPC.DTTags.ProductName = masterResult[0][0].ProductName;
               //IBalanceOPC.BalanceTags.intValue = values;
               IDTOPC.DTTags.TestResult = result;
               IDTOPC.DTTags.Side = masterResult[0][0].Side;
               IDTOPC.DTTags.TestName = strTest;
               //result.incompleteData.BalanceId
               objOPC.exportToOPC_DT(masterResult[0][0].DTID, IDTOPC.DTTags);
         }
      } catch (err) {
         throw new Error(err);
      }
   }
   async TDT(srNo, remark) {
      try {
         var selectTDTobj = {
            str_tableName: 'tbl_tab_tapdensity',
            data: '*',
            condition: [
               { str_colName: 'RepSerNo', value: srNo }
            ]
         }
         if (remark == 'Complies') {
            remark = true
         } else {
            remark = false
         }
         var queryResult = await database.select(selectTDTobj);
         var strTest = 'Tap Density';
         const ITDTOPC = new BalanceOPCInterface();
         ITDTOPC.TDTTags.TestName = strTest;
         ITDTOPC.TDTTags.ProductName = queryResult[0][0].ProductName;
         // IVernierOPC.VernierTags.strDate = result.incompleteData.PrDate;
         ITDTOPC.TDTTags.TestStart = `${await timeConverter.convertDate(queryResult[0][0].PrDate, "DD-MM-YYYY")} ${queryResult[0][0].PrTime}`;
         ITDTOPC.TDTTags.QuantityOfSample = queryResult[0][0].SampleWeight;
         ITDTOPC.TDTTags.BatchNo = queryResult[0][0].BatchNo;
         ITDTOPC.TDTTags.TestResult = remark;
         ITDTOPC.TDTTags.TestEnd = `${await timeConverter.convertDate(queryResult[0][0].PrEndDate, "DD-MM-YYYY")} ${queryResult[0][0].PrEndTime}`;
         ITDTOPC.TDTTags.Lot = queryResult[0][0].Lot;
         ITDTOPC.TDTTags.VolumeOccupiedVo = queryResult[0][0].SampleVol;
         ITDTOPC.TDTTags.TappedDensity = queryResult[0][0].TappedDensity;
         //IBalanceOPC.BalanceTags.intValue = values;
         ITDTOPC.TDTTags.TappedvolumeV10 = queryResult[0][0].TapVol1;
         ITDTOPC.TDTTags.TappedvolumeV500 = queryResult[0][0].TapVol2;
         ITDTOPC.TDTTags.TappedvolumeV1250a = queryResult[0][0].TapVol3;
         ITDTOPC.TDTTags.TappedvolumeV1250b = queryResult[0][0].TapVol4;
         ITDTOPC.TDTTags.TappedvolumeV1250c = queryResult[0][0].TapVol5;
         ITDTOPC.TDTTags.Method = queryResult[0][0].Method;
         ITDTOPC.TDTTags.Layer = queryResult[0][0].Layer;
         //result.incompleteData.BalanceId
         objOPC.exportToOPC_TDT(queryResult[0][0].TDensityID, ITDTOPC.TDTTags);

      } catch (err) {
         throw new Error(err);
      }
   }
   async SieveShaker(lastInsertedID, strTest) {
      try {

         var strTest = strTest;
         const ISSOPC = new BalanceOPCInterface();
         var strTableName = "";
         var detailTable = "";
         if (strTest == '%Fine') {
            // fine Percentage
            strTableName = 'tbl_tab_master17',
               detailTable = 'tbl_tab_detail17'
         } else {
            // Particle size
            strTableName = 'tbl_tab_master18',
               detailTable = 'tbl_tab_detail18'
         }
         var masterObj = {
            str_tableName: strTableName,
            data: '*',
            condition: [
               { str_colName: 'RepSerNo', value: lastInsertedID, comp: 'eq' },
            ]
         }
         var detailObj = {
            str_tableName: detailTable,
            data: '*',
            condition: [
               { str_colName: 'RepSerNo', value: lastInsertedID, comp: 'eq' },
            ]
         }
         var masterRes = await database.select(masterObj);
         var detailRes = await database.select(detailObj);
         if (masterRes[0].length != 0 && detailRes[0].length != 0) {


            ISSOPC.SSTags.TestName = strTest;
            ISSOPC.SSTags.ProductName = masterRes[0][0].ProductName;
            // IVernierOPC.VernierTags.strDate = result.incompleteData.PrDate;
            ISSOPC.SSTags.TestStart = `${await timeConverter.convertDate(masterRes[0][0].PrDate, "DD-MM-YYYY")} ${masterRes[0][0].PrTime}`;

            ISSOPC.SSTags.BatchNo = masterRes[0][0].BatchNo;
            ISSOPC.SSTags.TestResult = true;
            // ISSOPC.SSTags.Endtime = MaxTimeRHS;
            ISSOPC.SSTags.Lot = masterRes[0][0].Lot;
            if (strTest == '%Fine') {

               ISSOPC.SSTags.QuantityAbove60Mesh = parseFloat(detailRes[0][1].DataValue).toFixed(0);
               ISSOPC.SSTags.PerFineAbove60Mesh = ((parseFloat(detailRes[0][1].DataValue) / parseFloat(detailRes[0][0].DataValue)) * 100).toFixed(0)
               ISSOPC.SSTags.QuantityOfSample = parseFloat(detailRes[0][0].DataValue).toFixed(0);
               ISSOPC.SSTags.PerFine = parseFloat(Math.round(ISSOPC.SSTags.PerFineAbove60Mesh * Math.pow(10, 0)) / Math.pow(10, 0)).toFixed(0);
               ISSOPC.SSTags.TestSamplePerFine = 0;
            } else {

               ISSOPC.SSTags.QuantityOfSample = parseFloat(detailRes[0][0].DataValue).toFixed(2);
               ISSOPC.SSTags.QuantityAbove20Mesh = parseFloat(detailRes[0][1].DataValue).toFixed(2);
               ISSOPC.SSTags.QuantityAbove40Mesh = parseFloat(detailRes[0][2].DataValue).toFixed(2);
               //IBalanceOPC.BalanceTags.intValue = values;
               ISSOPC.SSTags.QuantityAbove60Mesh = parseFloat(detailRes[0][3].DataValue).toFixed(2);
               ISSOPC.SSTags.QuantityAbove80Mesh = parseFloat(detailRes[0][4].DataValue).toFixed(2);
               ISSOPC.SSTags.QuantityAbove100Mesh = parseFloat(detailRes[0][5].DataValue).toFixed(2);
               ISSOPC.SSTags.finesOnTheColectngtray = parseFloat(detailRes[0][6].DataValue).toFixed(2);
               ISSOPC.SSTags.TestSamplePerFine = 0;
               ISSOPC.SSTags.perFineAbove20Mesh = ((parseFloat(detailRes[0][1].DataValue) / parseFloat(detailRes[0][0].DataValue)) * 100).toFixed(2);
               ISSOPC.SSTags.PerFineAbove40Mesh = ((parseFloat(detailRes[0][2].DataValue) / parseFloat(detailRes[0][0].DataValue)) * 100).toFixed(2);
               ISSOPC.SSTags.PerFineAbove60Mesh = ((parseFloat(detailRes[0][3].DataValue) / parseFloat(detailRes[0][0].DataValue)) * 100).toFixed(2);
               ISSOPC.SSTags.PerFineAbove80Mesh = ((parseFloat(detailRes[0][4].DataValue) / parseFloat(detailRes[0][0].DataValue)) * 100).toFixed(2);
               ISSOPC.SSTags.PerFineAbove100Mesh = ((parseFloat(detailRes[0][5].DataValue) / parseFloat(detailRes[0][0].DataValue)) * 100).toFixed(2);
               ISSOPC.SSTags.PerFineOnTheColectngtray = ((parseFloat(detailRes[0][6].DataValue) / parseFloat(detailRes[0][0].DataValue)) * 100).toFixed(2);
               ISSOPC.SSTags.PerFine = parseFloat(Math.round(ISSOPC.SSTags.PerFineAbove60Mesh * Math.pow(10, 0)) / Math.pow(10, 0));
            }
            //result.incompleteData.BalanceId
            objOPC.exportToOPC_SS(masterRes[0][0].BalanceId, ISSOPC.SSTags);
         } else {
            return false;
         }

      } catch (err) {
         throw new Error(err);
      }
   }
   async Friability(srNo, remark) {
      try {
         var selectFriaobj = {
            str_tableName: 'tbl_tab_friability',
            data: '*',
            condition: [
               { str_colName: 'RepSerNo', value: srNo }
            ]
         }
         if (remark == 'Complies') {
            remark = true
         } else {
            remark = false
         }

         var queryResult = await database.select(selectFriaobj);

         var WightAftrTest = 0;
         var WightBefrTest = 0;
         var WightAftrTestRHS = 0;
         var WightBefrTestRHS = 0;
         let calculationLHS = 0;
         let calculationRHS = 0;
         if (queryResult[0][0].Side == 'Single') {
            WightAftrTest = queryResult[0][0].NWtAfterTest;
            WightBefrTest = queryResult[0][0].NWtBeforeTest;
            calculationLHS = (((WightBefrTest - WightAftrTest) / WightBefrTest) * 100);
         } else {
            WightAftrTest = queryResult[0][0].LWtAfterTest;
            WightBefrTest = queryResult[0][0].LWtBeforeTest;
            WightAftrTestRHS = queryResult[0][0].RWtAfterTest;
            WightBefrTestRHS = queryResult[0][0].RWtBeforeTest;
            calculationLHS = (((WightBefrTest - WightAftrTest) / WightBefrTest) * 100);
            calculationRHS = (((WightBefrTestRHS - WightAftrTestRHS) / WightBefrTestRHS) * 100);
         }
         // calculation = (((WightBefrTest - WightAftrTest) / WightBefrTest) * 100);
         var strTest = 'Friability';
         const IFriOPC = new BalanceOPCInterface();
         IFriOPC.FribltyTags.ActualCount = queryResult[0][0].SetCount;
         IFriOPC.FribltyTags.ActualRpm = queryResult[0][0].SetRPM;
         // IVernierOPC.VernierTags.strDate = result.incompleteData.PrDate;
         IFriOPC.FribltyTags.BatchNo = queryResult[0][0].BatchNo;
         IFriOPC.FribltyTags.TestStart = `${await timeConverter.convertDate(queryResult[0][0].PrDate, "DD-MM-YYYY")} ${queryResult[0][0].PrTime}`;
         IFriOPC.FribltyTags.TestEnd = `${await timeConverter.convertDate(queryResult[0][0].PrEndDate, "DD-MM-YYYY")} ${queryResult[0][0].PrEndTime}`;
         IFriOPC.FribltyTags.ActFriabilityLHS = parseFloat(calculationLHS).toFixed(3);
         IFriOPC.FribltyTags.ActFriabilityRHS = parseFloat(calculationRHS).toFixed(3);
         IFriOPC.FribltyTags.Lot = queryResult[0][0].Lot;
         IFriOPC.FribltyTags.NoOfSample = queryResult[0][0].FriabilityQty;
         IFriOPC.FribltyTags.ProductName = queryResult[0][0].ProductName;
         IFriOPC.FribltyTags.TestResult = remark;
         //IBalanceOPC.BalanceTags.intValue = values;
         IFriOPC.FribltyTags.Side = queryResult[0][0].Side == 'Single' ? "NA" : "LHS&RHS";
         IFriOPC.FribltyTags.TestName = strTest;
         IFriOPC.FribltyTags.WeightAfterTestLHS = parseFloat(WightAftrTest).toFixed(3);
         IFriOPC.FribltyTags.WeightBeforeTestLHS = parseFloat(WightBefrTest).toFixed(3);
         IFriOPC.FribltyTags.WeightAfterTestRHS = parseFloat(WightAftrTestRHS).toFixed(3);
         IFriOPC.FribltyTags.WeightBeforeTestRHS = parseFloat(WightBefrTestRHS).toFixed(3);
         //result.incompleteData.BalanceId
         objOPC.exportToOPC_Friability(queryResult[0][0].FriabilityID, IFriOPC.FribltyTags);

      } catch (err) {
         throw new Error(err);
      }
   }
   async Differential(typeValue, result, ResultOfReport){
      try {
        
         var strTest = 'Differential';
         const IDifferentialOPC = new BalanceOPCInterface();
         IDifferentialOPC.DifferentialTags.TestName = strTest;
         IDifferentialOPC.DifferentialTags.ProductName = result.incompleteData.ProductName;
         IDifferentialOPC.DifferentialTags.TestStart = await timeConverter.convertDate(result.incompleteData.PrDate, "DD-MM-YYYY") + " " + result.incompleteData.PrTime;
         IDifferentialOPC.DifferentialTags.ActMaximumIndiWeight = 0;
         IDifferentialOPC.DifferentialTags.ActMinimumIndiWeight = 0;
         IDifferentialOPC.DifferentialTags.AverageIndiWeight = 0;
         IDifferentialOPC.DifferentialTags.NoOfSample_DiffWt = result.incompleteData.Qty;
         IDifferentialOPC.DifferentialTags.BatchNo = result.incompleteData.BatchNo;
         IDifferentialOPC.DifferentialTags.Side = result.incompleteData.Side;
         const values = [];
         var Result = true;
         var aboveBelowT1 = 0;
         for (const val of result.detailData) {
            values.push(parseFloat(val.DataValue));
         }
         if (ResultOfReport != 'LE0') {
            Result = false;
         }
         let sum = values.reduce((previous, current) => current += previous);
         let avg = sum / values.length;

         IDifferentialOPC.DifferentialTags.ActMaximumNetWeight = Math.max(...values);
         IDifferentialOPC.DifferentialTags.ActMinimumNetWeight = Math.min(...values);
         IDifferentialOPC.DifferentialTags.AverageNetWeight = avg;
         IDifferentialOPC.DifferentialTags.TestResult_DiffWtVariation = Result;
         IDifferentialOPC.DifferentialTags.TestEnd = await timeConverter.convertDate(result.incompleteData.PrEndDate, "DD-MM-YYYY") + " " + result.incompleteData.PrEndTime;
         IDifferentialOPC.DifferentialTags.Lot = result.incompleteData.Lot;
         objOPC.exportToOPC_Differential(result.incompleteData.BalanceId, IDifferentialOPC.DifferentialTags);
      } catch (err) {
         throw new Error(err);
      }
   }
   async Hardness1050(masterData, DetailData, idsNo) {
      try {
         var strTest = 'Hardness';
         var tempLimObj = globalData.arr_limits.find(k => k.idsNo == idsNo);
         let sumHT = 0;
         let sumT = 0;
         let sumDLB = 0;
         let arrHTDetail = [];
         let arrTDetail = [];
         let outFlagHTD = 0;
         let arrDLBDetail = [];
         let outFlagThickness = 0;
         let outFlagDOLOBO = 0;
         let remark;
         let remarkHardness = true;
         let remarkDiameter = true;
         let remarkLength = true;
         let remarkThickness = true;
         let maxHTDLimit = parseFloat(tempLimObj.Hardness.T1Pos);
         let minHTDLimit = parseFloat(tempLimObj.Hardness.T1Neg);
         // if (tempLimObj.Thickness == undefined) {
         //    var maxTLimit = 0;
         //    var minTLimit = 0;
         // } else {
         //    var maxTLimit = parseFloat(formulaFun.upperLimit(tempLimObj.Thickness));
         //    var minTLimit = parseFloat(formulaFun.lowerLimit(tempLimObj.Thickness));
         // }

         // if(masterData.NomDOLOBO != 0) {
         // if (masterData.ColHeadDOLOBO == 'NA') {
         //    var maxDLBLimit = 0;
         //    var minDLBLimit = 0;
         // } else {
         //    if (tempLimObj.length == undefined && tempLimObj.Breadth == undefined && tempLimObj.Diameter == undefined) {
         //       var maxDLBLimit = 0;
         //       var minDLBLimit = 0;
         //    } else {
         //       var maxDLBLimit = parseFloat(formulaFun.upperLimit(tempLimObj[masterData.ColHeadDOLOBO]));
         //       var minDLBLimit = parseFloat(formulaFun.lowerLimit(tempLimObj[masterData.ColHeadDOLOBO]));
         //    }

         // }
         let storeval = masterData.data.map((k)=>{
            return {
               [`${k["str_colName"]}`] : k.value
            }
        })
        let FinalValue = Object.assign({},...storeval)


         let count = DetailData.length;
         for (var i = 0; i < DetailData.length; i++) {
            var dataValHard = parseFloat(DetailData[i].DataValue);
            if (isNaN(dataValHard)) { dataValHard = 0 }
            if ((minHTDLimit > dataValHard) || (dataValHard > maxHTDLimit)) {
               outFlagHTD = outFlagHTD + 1;
               remarkHardness = false;
            }
            arrHTDetail.push(dataValHard);
            console.log(arrHTDetail)
            // var dataValThick = parseFloat(DetailData[i].DataValueThick);
            // if (isNaN(dataValThick)) { dataValThick = 0 }
            // if (minTLimit != 0 && maxTLimit != 0) {
            //    if ((minTLimit > dataValThick) || (dataValThick > maxTLimit)) {
            //       outFlagThickness = outFlagThickness + 1;
            //       remarkThickness = false;
            //    }
            // }
            // arrTDetail.push(dataValThick);
            // var dataValDLB = parseFloat(DetailData[i].DataValueDOLOBO);
            // if (isNaN(dataValDLB)) { dataValDLB = 0 }
            // if (minDLBLimit != 0 && maxDLBLimit != 0) {
            //    if ((minDLBLimit > dataValDLB) || (dataValDLB > maxDLBLimit)) {
            //       outFlagDOLOBO = outFlagDOLOBO + 1;
            //       if (masterData.ColHeadDOLOBO == 'Diameter') {
            //          remarkDiameter = false;

            //       } else if (masterData.ColHeadDOLOBO == 'Length') {
            //          remarkLength = false;
            //       }
            //    }
            // }
            // arrDLBDetail.push(dataValDLB);
         }
         // if (masterData.NomDOLOBO != 0 && masterData.NegTolHard != 0 && masterData.NomThick) {
         //    if (outFlagHTD != 0 || outFlagThickness != 0 || outFlagDOLOBO != 0) {
         //       remark = 'Not Complies';
         //    } else {
         //       remark = 'Complies';
         //    }
         // } else if (masterData.NomDOLOBO == 0 && masterData.NegTolHard != 0 && masterData.NomThick != 0) {
         //    if (outFlagHTD != 0 || outFlagThickness != 0) {
         //       remark = 'Not Complies'
         //    } else {
         //       remark = 'Complies';
         //    }
         // } else if (masterData.NomDOLOBO != 0 && masterData.NegTolHard != 0 && masterData.NomThick == 0) {
         //    if (outFlagHTD != 0 || outFlagDOLOBO != 0) {
         //       remark = 'Not Complies'
         //    } else {
         //       remark = 'Complies';
         //    }
         // } else if (masterData.NomDOLOBO == 0 && masterData.NegTolHard != 0 && masterData.NomThick == 0) {
         //    if (outFlagHTD != 0) {
         //       remark = 'Not Complies'
         //    } else {
         //       remark = 'Complies';
         //    }
         // }
         for (var j = 0; j < arrHTDetail.length; j++) {
            sumHT = sumHT + parseFloat(arrHTDetail[j]);
         }
         // for (var k = 0; k < arrTDetail.length; k++) {
         //    sumT = sumT + parseFloat(arrTDetail[k]);
         // }
         // for (var l = 0; l < arrDLBDetail.length; l++) {
         //    sumDLB = sumDLB + parseFloat(arrDLBDetail[l]);
         // }
         var MaxHard = Math.max(...arrHTDetail);
         var MinHard = Math.min(...arrHTDetail);
         var avgHard = (sumHT / count);
         // var MaxThick = Math.max(...arrTDetail);
         // var MinThick = Math.min(...arrTDetail);
         // var AvgThick = (sumT / count);
         // var MaxDLB = Math.max(...arrDLBDetail);
         // var MinDLB = Math.min(...arrDLBDetail);
         // var AvgDLB = (sumDLB / count);
         const IHardnessOPC = new BalanceOPCInterface();
 
            IHardnessOPC.HTTags.ActMaximumlength = 0;
            IHardnessOPC.HTTags.ActMinimumlength = 0;
            IHardnessOPC.HTTags.Averagelength = 0;


         IHardnessOPC.HTTags.ActMaximumHardness = MaxHard.toFixed(0);
         // IVernierOPC.VernierTags.strDate = result.incompleteData.PrDate;

         IHardnessOPC.HTTags.ActMaximumThickness = 0;

         IHardnessOPC.HTTags.ActMinimumHardness = MinHard.toFixed(0);

         IHardnessOPC.HTTags.ActMinimumThickness = 0;

         IHardnessOPC.HTTags.AverageHardness = avgHard.toFixed(0);
         //IBalanceOPC.BalanceTags.intValue = values;

         IHardnessOPC.HTTags.AverageThickness = 0;
         IHardnessOPC.HTTags.BatchNo = FinalValue.BatchNo;
         IHardnessOPC.HTTags.Lot = FinalValue.Lot;
         IHardnessOPC.HTTags.NoOfSample = FinalValue.Qty;
         //IBalanceOPC.BalanceTags.intValue = values;
         IHardnessOPC.HTTags.ProductName = FinalValue.ProductName;
         IHardnessOPC.HTTags.Side = FinalValue.Side;
         IHardnessOPC.HTTags.TestEnd = `${await timeConverter.convertDate(FinalValue.PrEndDate, "DD-MM-YYYY")} ${FinalValue.PrEndTime}`;
         IHardnessOPC.HTTags.TestName = strTest;
         IHardnessOPC.HTTags.TestResultDiameter = false;
         IHardnessOPC.HTTags.TestResultHardness = remarkHardness;
         IHardnessOPC.HTTags.TestResultlength = false;
         IHardnessOPC.HTTags.TestResultThickness = false;
         IHardnessOPC.HTTags.TestStart = `${await timeConverter.convertDate(FinalValue.PrDate, "DD-MM-YYYY")} ${FinalValue.PrTime}`;

         //result.incompleteData.BalanceId
         objOPC.exportToOPC_MultiParamHardness(FinalValue.HardnessID, IHardnessOPC.HTTags);

      } catch (err) {
         throw new Error(err);
      }
   }
}
module.exports = OPCOperations;