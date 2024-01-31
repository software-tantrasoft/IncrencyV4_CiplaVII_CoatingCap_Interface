const globalData = require('../global/globalData');
const Database = require('../database/clsQueryProcess');
const moment = require('moment');
const serverConfig = require('../global/severConfig')
const timeZone = require('../middleware/setTimeZone');
const objEncryptDecrypt = require('../middleware/encdecAlgo');
const objCheckSum = require('../middleware/checksum');
const objServer = require('../../index.js');
var logFromPC = require('../model/clsLogger');
var colors = require('colors');
const database = new Database();
const date = require('date-and-time');
let in_array = require('in_array');
const Hardness = require('./BulkWeighments/clsSaveCompleteHardness');
const TDT = require('./BulkWeighments/clsSaveTDT');
const Friability = require('./BulkWeighments/clsSaveFriability');
const LOD = require('./BulkWeighments/clsSaveLOD');
const ProductDetail = require('./clsProductDetailModel');
const bulkInvalid = require('../../Interfaces/IBulkInvalid.model');
const app = require('../app');
const hardnessData = new Hardness();
const tdtData = new TDT();
const friabilityData = new Friability();
const lodData = new LOD();
const clsActivityLog = require('./clsActivityLogModel');
const objActivityLog = new clsActivityLog();
const InstrumentUsage = require('./clsInstrumentUsageLog');
const objInstrumentUsage = new InstrumentUsage();
const objProduct = new ProductDetail();
var clsMonitor = require('../model/MonitorSocket/clsMonitSocket');
const BatchSummary = require('./Weighments/clsBatchSummaryDataTransfer');
const objBatchSummary = new BatchSummary();
const clsProtocolStore = require('../global/protocolStore');
const objProtocolStore = new clsProtocolStore();
// Creating object of each classes
const objMonitor = new clsMonitor();
const printReport = require('../model/Weighments/clsPrintReport');
const IOnlinePrint = require('../../Interfaces/IOnlinePrint.model');
const ClsProduct = require('./clsProductDetailModel');
const CalculateDp = require('../middleware/calculateDP');
const FetchDetails = require('.//clsFetchDetails');
const fetchDetails = new FetchDetails();
const calculateDp = new CalculateDp();
const proObj = new ClsProduct();
const objPrintReport = new printReport();
const ErrorLog = require('../model/clsErrorLog');
const clsSP = require('../model/clsStoreProcedure');
const objSP = new clsSP();
let clsGetMstSrAndSideSr = require('../model/Weighments/clsGetMstSrAndSideSr')
const objGetMstSrAndSideSr = new clsGetMstSrAndSideSr();

const PowerBackup = require('./clsPowerBackupModel');
const clspowerbackup = new PowerBackup();

const clsRemarkInComplete = require('../model/clsRemarkIncomplete');
const objRemarkInComplete = new clsRemarkInComplete();

const InCompleteGranulation = require('../model/Granulation/clsIncompleteGranulationDataSave');
const objIncompleteGran = new InCompleteGranulation();

const clsCheckGranulation = require('./Granulation/clsCheckGranulationData');
const objCheckGran = new clsCheckGranulation();

//const objTDT = { IDSNO: 250, arr: [] };

const TimeFormat = "HH:mm:ss";
class BulkWeighment {

    /**
     * @description Dt Data come here
     * @param {*} IdsNo holds current `ids number`
     * @param {*} protocol incoming protocol
     * @returns Promise <> response to `ids`
     */

    async insertBulkWeighmentDT_OLD(IdsNo, protocol, DTModel) {
        try {

            var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var currentCubicleObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var selectedIds;
            var ModeType;// dual mode or registration mode
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var actualProtocol = protocol;
            var tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var tdValue = actualProtocol.substring(0, 5);
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var objArrLimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
            var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
            var protocolIncomingType = tdValue.substring(0, 1);//Check incoming Protocol is from "T" or "H"

            globalData.arrTDTData.push({
                strsettemp: [],
                ediflg: false
            })


            if (tdValue != "TD000" && tdValue != "HD000" && tdValue != "ED000") {
                /**
                * @description We are here setting TD000 and HD000 to false
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }
                /************************************************************* */

                var bulkDataFlag = globalData.arrBulkDataFlag.find(k => k.IdsNo == IdsNo);
                var tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);

                var sample_recived = false;

                var jarType = "A";

                var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                if (objJARTypeDT != undefined) {
                    if (objJARTypeDT.JarType == "A") {
                        jarType = "A";
                    }
                    else {
                        jarType = "B";
                    }
                }
                var BathTemp = actualProtocol.includes("SET BATH TEMP")


                if (BathTemp == true) {

                    var temp = actualProtocol.split(':')[2].trim();
                    temp = temp.replace(/[\sNRrn]+/g, "|");
                    temp = temp.split("|")[0];
                    tempDTObj.Bath_Temp = temp;
                    if (productObj.Sys_RotaryType == "Double") {
                        tempDTObj.bsetdata = temp
                    }
                }

                if (actualProtocol.includes("SET TEMP") && (actualProtocol.includes("BATH") == false)) {


                    globalData.arrTDTData[0].ediflg = true

                    globalData.arrTDTData[0].strsettemp = actualProtocol


                }

                var Model = (actualProtocol.includes("MODEL") || actualProtocol.includes("Model No"));
                if (Model == true) {
                    var prepend = 'Electrolab ';
                    const objBulkInvalid = new bulkInvalid();
                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                    objBulkInvalid.invalidObj.DT.invalid = false;
                    objBulkInvalid.invalidObj.DT.invalidMsg = "";
                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                    var model_name = actualProtocol.split(':')[1].trim();
                    var strModel_name = model_name.split(' ')[0].toString();
                    var Model = prepend.concat(strModel_name);


                    if (Model.includes('ED3PO')) {

                        // const objBulkInvalid = new bulkInvalid();
                        // objBulkInvalid.invalidObj.idsNo = IdsNo;
                        // objBulkInvalid.invalidObj.DT.invalid = true;
                        // objBulkInvalid.invalidObj.DT.invalidMsg = `DATA RECEIVED from ${{ strModel_name }} INSTED OF  ${{ DTModel }}`;
                        // Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'DT', flag: 'ABORTED' } });
                        return `${protocolIncomingType}R40Invalid String,,,,`
                    }


                }

                var testSummaryVal = actualProtocol.includes("Start Date");
                if (testSummaryVal == true) {
                    let tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                    bulkDataFlag.flgDTFlag = true;
                    // Activity Log for DT weighmnet started
                    var objActivity = {};
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'DT Weighment Started on IDS' + IdsNo });
                    objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                    // Instrument usage for DT start
                    objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', 'DT', 'started');
                    // Added on 04-09-2020 to support date complication by pradip
                    var str_startDate = actualProtocol.split('Date:')[1].includes('N') == true ? actualProtocol.split('Date:')[1].split('N') : actualProtocol.split('Date:')[1].split('R')[0].trim();
                    str_startDate = str_startDate[0].trim();
                    var stDateObj = { "A_startDate": str_startDate, "B_startDate": str_startDate };
                    //globalData.arrDTData.push(stObj);
                    tempDTObj.arr_info.push(stDateObj);
                    // const objBulkInvalid = new bulkInvalid();
                    // objBulkInvalid.invalidObj.idsNo = IdsNo;
                    // objBulkInvalid.invalidObj.DT.invalid = false;
                    // objBulkInvalid.invalidObj.DT.invalidMsg = "";
                    // Object.assign(objInvalid, objBulkInvalid.invalidObj);
                }
                if (bulkDataFlag.flgDTFlag == true) {

                    var testStartTime = actualProtocol.includes("START TIME");
                    if (testStartTime == true) {
                        var startTime = actualProtocol;
                        if (actualProtocol.split("|")[1].trim())
                            var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);


                        var jartypeST = actualProtocol.split("|")[1].trim().match(/\d+/g) == null ? obJARTypeDT.JarType = "B" : obJARTypeDT.JarType = "A"


                        if (productObj.Sys_RotaryType == 'Single' && jartypeST == "A") {

                            if (!moment(startTime.split("|")[1].trim(), TimeFormat, true).isValid()) {

                                const BulkInvalid = new bulkInvalid();
                                BulkInvalid.invalidObj.idsNo = IdsNo;
                                BulkInvalid.invalidObj.DT.invalid = true;
                                BulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A START TIME,IS NOT VALID";
                                Object.assign(objInvalid, BulkInvalid.invalidObj);

                            }

                        }
                        else if (productObj.Sys_RotaryType == 'Single' && jartypeST == "B") {

                            if (!moment(startTime.split("|")[2].trim(), TimeFormat, true).isValid()) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B START TIME,IS NOT VALID";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                        }
                        else {
                            // Check the time value is valid or not 
                            if (!moment(startTime.split("|")[1].trim(), TimeFormat, true).isValid() && objInvalid.DT.invalid == false) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A START TIME,IS NOT VALID";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }
                            if (!moment(startTime.split("|")[2].trim(), TimeFormat, true).isValid() && objInvalid.DT.invalid == false) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B START TIME,IS NOT VALID";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                        }

                        var stObj = { "A_st": startTime.split("|")[1].trim(), "B_st": startTime.split("|")[2].trim() };
                        //globalData.arrDTData.push(stObj);
                        tempDTObj.arr_heading.push(stObj);
                    }

                    var testEndTime = actualProtocol.includes("END TIME");
                    if (testEndTime == true) {
                        var endTime = actualProtocol;
                        var JARTypeobj = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                        var jar = actualProtocol.split("|")[1].trim().match(/\d+/g) == null ? JARTypeobj.JarType = "B" : JARTypeobj.JarType = "A"

                        if (productObj.Sys_RotaryType == 'Single' && jar == "A") {

                            if (!moment(endTime.split("|")[1].trim(), TimeFormat, true).isValid()
                            ) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A END TIME,IS NOT VALID";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                        }
                        else if (productObj.Sys_RotaryType == 'Single' && jar == "B") {

                            if (!moment(endTime.split("|")[2].trim(), TimeFormat, true).isValid()
                            ) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B END TIME,IS NOT VALID";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                        }
                        else {
                            if (!moment(endTime.split("|")[1].trim(), TimeFormat, true).isValid() && objInvalid.DT.invalid == false) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A END TIME,IS NOT VALID";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                            if (!moment(endTime.split("|")[2].trim(), TimeFormat, true).isValid() && objInvalid.DT.invalid == false) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B END TIME,IS NOT VALID";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                        }


                        var etObj = { "A_et": endTime.split("|")[1].trim(), "B_et": endTime.split("|")[2].trim() };
                        //globalData.arrDTData.push(etObj);
                        tempDTObj.arr_heading.push(etObj);
                    }


                    var str_mode = actualProtocol.includes("Dual");
                    if (str_mode == true) {
                        ModeType = actualProtocol.split(":")[1].trim();
                        ModeType = ModeType.substring(0, 4);
                        tempDTObj.mode = 'Dual'

                    }

                    var testBasketType = actualProtocol.includes("BASKET TYPE ");

                    if (testBasketType == true) {
                        var basketA = actualProtocol.split("|")[1].trim()
                        tempDTObj.basketType = basketA;
                    }


                    var testDurTime = actualProtocol.includes("TEST ON DUR");
                    if (testDurTime == true) {
                        var durTime = actualProtocol;

                    }

                    if (testDurTime) {
                        if (tempDTObj.mode == 'Dual') {
                            var sample = actualProtocol;
                            var jar = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                            if (productObj.Sys_RotaryType == 'Single' && jar.JarType == "A") {
                                if (!moment(sample.split("|")[1].trim(), TimeFormat, true).isValid()) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,DURATION TIME,IS NOT VALID";

                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);

                                }
                            } else if (productObj.Sys_RotaryType == 'Single' && jar.JarType == "B") {
                                if (!moment(sample.split("|")[2].trim(), TimeFormat, true).isValid()) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,DURATION TIME,IS NOT VALID";

                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);

                                }
                            } else {
                                if (!moment(sample.split("|")[1].trim(), TimeFormat, true).isValid()) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,DURATION TIME,IS NOT VALID";

                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);

                                }
                                if (!moment(sample.split("|")[2].trim(), TimeFormat, true).isValid()) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,DURATION TIME,IS NOT VALID";

                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);

                                }
                            }
                            var sample1 = { "A": sample.split("|")[1].trim(), "B": sample.split("|")[2].trim() };
                            //globalData.arrDTDataReading.push(c1Obj);
                            if (sample1.A != undefined && sample1.B != undefined) {
                                tempDTObj.arr_reading.push(sample1);
                            }
                        }
                    }
                    var JARTypeobj = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                    var count1 = actualProtocol.includes("1. ");
                    if (count1 == true) {
                        var countOne = actualProtocol;
                        if (countOne.split("|")[1].trim().split(':').length >= 4 || (countOne.split("|")[2].trim().split(':').length >= 4)) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        } else {
                            await this.validateTwoSaTime(countOne, productObj, JARTypeobj, IdsNo);
                            var c1Obj = { "A": countOne.split("|")[1], "B": countOne.split("|")[2] };
                            //globalData.arrDTDataReading.push(c1Obj);
                            if (c1Obj.A != undefined && c1Obj.B != undefined) {
                                tempDTObj.arr_reading.push(c1Obj);
                            }
                        }

                    }
                    var count2 = actualProtocol.includes("2. ");
                    if (count2 == true) {
                        var countTwo = actualProtocol;

                        //globalData.arrDTDataReading.push(c2Obj);


                        if (countTwo.split("|")[1].trim().split(':').length >= 4 || (countTwo.split("|")[2].trim().split(':').length >= 4)) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }
                        else {
                            var c2Obj = { "A": countTwo.split("|")[1], "B": countTwo.split("|")[2] };
                            await this.validateTwoSaTime(countTwo, productObj, JARTypeobj, IdsNo);
                            if (c2Obj.A != undefined && c2Obj.B != undefined) {
                                tempDTObj.arr_reading.push(c2Obj);
                            }
                        }
                    }
                    var count3 = actualProtocol.includes("3. ");
                    if (count3 == true) {
                        var countThree = actualProtocol;

                        //globalData.arrDTDataReading.push(c3Obj);

                        if (countThree.split("|")[1].trim().split(':').length >= 4 || (countThree.split("|")[2].trim().split(':').length >= 4)) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }
                        else {
                            var c3Obj = { "A": countThree.split("|")[1], "B": countThree.split("|")[2] };
                            await this.validateTwoSaTime(countThree, productObj, JARTypeobj, IdsNo);
                            if (c3Obj.A != undefined && c3Obj.B != undefined) {
                                tempDTObj.arr_reading.push(c3Obj);
                            }
                        }


                    }
                    var count4 = actualProtocol.includes("4. ");
                    if (count4 == true) {


                        var countFour = actualProtocol;


                        if (countFour.split("|")[1].trim().split(':').length >= 4 || (countFour.split("|")[2].trim().split(':').length >= 4)) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }

                        else {
                            var c4Obj = { "A": countFour.split("|")[1], "B": countFour.split("|")[2] };
                            //globalData.arrDTDataReading.push(c4Obj);
                            await this.validateTwoSaTime(countFour, productObj, JARTypeobj, IdsNo);
                            if (c4Obj.A != undefined && c4Obj.B != undefined) {
                                tempDTObj.arr_reading.push(c4Obj);
                            }
                        }


                    }
                    var count5 = actualProtocol.includes("5. ");
                    if (count5 == true) {
                        var countFive = actualProtocol;

                        if (countFive.split("|")[1].trim().split(':').length >= 4 || (countFive.split("|")[2].trim().split(':').length >= 4)) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }
                        else {
                            var c5Obj = { "A": countFive.split("|")[1], "B": countFive.split("|")[2] };
                            //globalData.arrDTDataReading.push(c5Obj);
                            await this.validateTwoSaTime(countFive, productObj, JARTypeobj, IdsNo);
                            if (c5Obj.A != undefined && c5Obj.B != undefined) {
                                tempDTObj.arr_reading.push(c5Obj);
                            }
                        }

                    }
                    var count6 = actualProtocol.includes("6. ");
                    if (count6 == true) {
                        var countSix = actualProtocol;

                        if (countSix.split("|")[1].trim().split(':').length >= 4 || (countSix.split("|")[2].trim().split(':').length >= 4)) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }
                        else {
                            var c6Obj = { "A": countSix.split("|")[1], "B": countSix.split("|")[2] };
                            //globalData.arrDTDataReading.push(c6Obj);
                            await this.validateTwoSaTime(countSix, productObj, JARTypeobj, IdsNo);
                            if (c6Obj.A != undefined && c6Obj.B != undefined) {
                                tempDTObj.arr_reading.push(c6Obj);
                            }
                            sample_recived = true;
                        }
                    }

                    var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                    if (obJARTypeDT == undefined) {
                        globalData.arrJARTypeDT.push({
                            idsNo: IdsNo,
                            JarType: "A",
                            sapoflg: false,

                        })
                    } else {
                        obJARTypeDT.idsNo = IdsNo;
                        obJARTypeDT.JarType = obJARTypeDT.JarType;
                        obJARTypeDT.sapoflg = false

                    }

                    if (sample_recived) {
                        var JARA = [], JARB = [];
                        //var selected_jar = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);

                        for (let i = 0; i < tempDTObj.arr_reading.length; i++) {
                            JARA.push(tempDTObj.arr_reading[i].A);
                            JARB.push(tempDTObj.arr_reading[i].B);
                        }
                        if (JARA[0].match(/\d+/g) && JARB[0].match(/\d+/g)) {
                            tempDTObj.rotaryType = "Double";
                        }
                        else {

                            tempDTObj.rotaryType = "Single";
                        }

                        if (tempDTObj.rotaryType != productObj.Sys_RotaryType) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }


                        for (let i = 0; i < tempDTObj.arr_reading.length; i++) {

                            if (JARA[i].match(/\d+/g)) {
                                obJARTypeDT.JarType = "A"
                            }
                            else if (JARB[i].match(/\d+/g)) {
                                obJARTypeDT.JarType = "B"
                            }
                        }


                    }

                    if (globalData.arrTDTData[0].ediflg == true && obJARTypeDT.JarType != undefined) {

                        if (productObj.Sys_RotaryType == 'Single') {
                            //tempTDObj.srtTempData = actualProtocol
                            if (obJARTypeDT.JarType == 'A') {
                                var temp = globalData.arrTDTData[0].strsettemp.split('|')[1].trim();
                                globalData.arrTDTData = []
                            }
                            else {
                                var temp = globalData.arrTDTData[0].strsettemp.split('|')[2].trim();
                                globalData.arrTDTData = []
                            }
                            tempDTObj.Bath_Temp = temp;
                        }
                        else {
                            tempDTObj.Bath_Temp = globalData.arrTDTData[0].strsettemp.split('|')[1].trim();
                            tempDTObj.bsetdata = globalData.arrTDTData[0].strsettemp.split('|')[2].trim();
                            globalData.arrTDTData = []

                        }
                    }




                    var haltDur = actualProtocol.includes("HALT DUR.");
                    if (haltDur == true) {
                        var jar = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                        var haltDuration = actualProtocol;
                        //console.log(haltDuration);
                        if (productObj.Sys_RotaryType == 'Single') {
                            let index = jar.JarType == 'A' ? 1 : 2;

                            if (!moment(haltDuration.split("|")[index].trim(), TimeFormat, true).isValid()

                            ) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = `JAR ${obJARTypeDT.JarType} HALT DURATION,IS NOT VALID`;
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                        }
                        else {
                            if (!moment(haltDuration.split("|")[1].trim(), TimeFormat, true).isValid() &&


                                objInvalid.DT.invalid == false) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A HALT DURATION,IS NOT VALID";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                            if (!moment(haltDuration.split("|")[2].trim(), TimeFormat, true).isValid()
                                &&
                                objInvalid.DT.invalid == false) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B HALT DURATION,IS NOT VALID";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }
                        }

                        var hdObj = { "A_hd": haltDuration.split("|")[1], "B_hd": haltDuration.split("|")[2] };
                        //globalData.arrDTData.push(hdObj);
                        tempDTObj.arr_heading.push(hdObj);
                    }


                    if (actualProtocol.includes("BATH")) {
                        globalData.arrJARTypeDT.sapoflg = true
                    }
                    var tempMin = actualProtocol.includes("TEMP. MIN.");
                    if (tempMin == true) {

                        var tempMinimum = actualProtocol;
                        var tempMinVal = tempMinimum.split(":")[1];
                        //var tempMinVal1 = tempMinVal.replace(/\s+/g, "|");
                        var tempMinVal1 = tempMinVal.replace(/[\sNR]+/g, "|");
                        // var bathtemp = actualProtocol.charAt(BathIndex);
                        // var Atemp = actualProtocol.charAt(Apointer);
                        // var Btemp = actualProtocol.charAt(Bpointer);

                        if (globalData.arrJARTypeDT.sapoflg == true) {

                            if (productObj.Sys_RotaryType == 'Single') {


                                if (obJARTypeDT.JarType == 'A') {
                                    var A_tempMin = tempMinVal1.split("|")[2] == '--' ? tempMinVal1.split("|")[3] : tempMinVal1.split("|")[2]
                                    var B_tempMin = 0
                                    var tempMinObj = { "A_tempMin": A_tempMin, "B_tempMin": B_tempMin };
                                    if (isNaN(A_tempMin) || A_tempMin.length === 0) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                                else {
                                    var A_tempMin = 0
                                    var B_tempMin = tempMinVal1.split("|")[2] == '--' ? tempMinVal1.split("|")[3] : tempMinVal1.split("|")[2]
                                    var tempMinObj = { "A_tempMin": A_tempMin, "B_tempMin": B_tempMin };
                                    if (isNaN(B_tempMin) || B_tempMin.length === 0) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                            }
                            else {
                                var A_tempMin = tempMinVal1.split("|")[2] == '--' ? 0 : tempMinVal1.split("|")[2]
                                var B_tempMin = tempMinVal1.split("|")[3] == '--' ? 0 : tempMinVal1.split("|")[3]
                                var tempMinObj = { "A_tempMin": A_tempMin, "B_tempMin": B_tempMin };

                                if (isNaN(A_tempMin) || isNaN(B_tempMin) || A_tempMin.length === 0 || B_tempMin.length === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }

                        }
                        else {

                            var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                            var A_Min = tempMinVal1.split("|")[1] == '--' ? 0 : tempMinVal1.split("|")[1]
                            var B_Min = tempMinVal1.split("|")[2] == '--' ? 0 : tempMinVal1.split("|")[2]
                            var tempMinObj = { "A_tempMin": A_Min, "B_tempMin": B_Min };
                            if (productObj.Sys_RotaryType == 'Single' && (A_Min != 0 && B_Min != 0)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                            if (productObj.Sys_RotaryType == 'Single' && obJARTypeDT.JarType === 'A') {
                                if (isNaN(A_Min) || A_Min === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            } else if (productObj.Sys_RotaryType == 'Single' && obJARTypeDT.JarType === 'B') {
                                if (isNaN(B_Min) || B_Min === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            } else if (productObj.Sys_RotaryType == 'Double') {
                                if (isNaN(A_Min) || A_Min === 0 || isNaN(B_Min) || B_Min === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }

                        }





                        if (tempMinVal1.split("|").length == 5) {
                            var A_Min = tempMinVal1.split("|")[2] == '--' ? 0 : tempMinVal1.split("|")[2]
                            var B_Min = tempMinVal1.split("|")[3] == '--' ? 0 : tempMinVal1.split("|")[3]
                            if (productObj.Sys_RotaryType == 'Single' && (A_Min != 0 && B_Min != 0)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                        }



                        //== '--' ? 0 : newDTData[3].A_tempMin
                        //globalData.arrDTData.push(tempMinObj);
                        tempDTObj.arr_heading.push(tempMinObj);
                    }

                    var tempMax = actualProtocol.includes("TEMP. MAX.");
                    if (tempMax == true) {
                        var tempMaximum = actualProtocol;
                        var tempMaxVal = tempMaximum.split(":")[1];
                        //var tempMaxVal1 = tempMaxVal.replace(/\s+/g, "|");
                        var tempMaxVal1 = tempMaxVal.replace(/[\sNR]+/g, "|");
                        if (globalData.arrJARTypeDT.sapoflg == true) {
                            if (productObj.Sys_RotaryType == 'Single') {
                                if (obJARTypeDT.JarType == 'A') {
                                    var A_tempMax = tempMaxVal1.split("|")[2] == '--' ? tempMaxVal1.split("|")[3] : tempMaxVal1.split("|")[2]
                                    var B_tempMax = 0
                                    var tempMaxObj = { "A_tempMax": A_tempMax, "B_tempMax": B_tempMax };
                                    if (isNaN(A_tempMax) || A_tempMax.length === 0) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                                else {
                                    var A_tempMax = 0
                                    var B_tempMax = tempMaxVal1.split("|")[2] == '--' ? tempMaxVal1.split("|")[3] : tempMaxVal1.split("|")[2]
                                    var tempMaxObj = { "A_tempMax": A_tempMax, "B_tempMax": B_tempMax };
                                    if (isNaN(B_tempMax) || B_tempMax.length === 0) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                            }
                            else {
                                var A_tempMax = tempMaxVal1.split("|")[2]
                                var B_tempMax = tempMaxVal1.split("|")[3]
                                var tempMaxObj = { "A_tempMax": A_tempMax, "B_tempMax": B_tempMax };
                                if (isNaN(A_tempMax) || isNaN(B_tempMax) || A_tempMax.length === 0 || B_tempMax.length === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }

                        }
                        else {
                            var A_tempMax = tempMaxVal1.split("|")[1] == '--' ? 0 : tempMaxVal1.split("|")[1];
                            var B_tempMax = tempMaxVal1.split("|")[2] == '--' ? 0 : tempMaxVal1.split("|")[2];
                            var tempMaxObj = { "A_tempMax": A_tempMax, "B_tempMax": B_tempMax };
                            var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                            // globalData.arrDTData.push(tempMaxObj);

                            if (productObj.Sys_RotaryType == 'Single' && obJARTypeDT.JarType === 'A') {
                                if (isNaN(A_tempMax) || A_tempMax === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            } else if (productObj.Sys_RotaryType == 'Single' && obJARTypeDT.JarType === 'B') {
                                if (isNaN(B_tempMax) || B_tempMax === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            } else if (productObj.Sys_RotaryType == 'Double') {
                                if (isNaN(A_tempMax) || A_tempMax === 0 || isNaN(B_tempMax) || B_tempMax === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }

                        }
                        tempDTObj.arr_heading.push(tempMaxObj);
                    }

                    var sign = actualProtocol.includes("SIGNATURE");
                    var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
                    if (sign == true && !objInvalid.DT.invalid) {
                        let tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                        var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                        //let tempmin = tempDTObj.arr_heading.filter(obj => obj.A_tempMin);


                        let A_MAX = tempDTObj.arr_heading.filter(obj => obj.A_tempMax);
                        let B_MAX = tempDTObj.arr_heading.filter(obj => obj.B_tempMax);

                        let A_MIN = tempDTObj.arr_heading.filter(obj => obj.A_tempMin);
                        let B_MIN = tempDTObj.arr_heading.filter(obj => obj.B_tempMin);

                        let tempmax = A_MAX.length == 0 ? B_MAX : A_MAX;
                        let tempmin = A_MIN.length == 0 ? B_MIN : A_MIN;

                        let productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                        if (productObj.Sys_RotaryType == 'Single') {
                            if (obJARTypeDT.JarType == 'A') {
                                let A_tempMin = tempmin[0].A_tempMin
                                let A_tempMax = tempmax[0].A_tempMax
                                if (parseFloat(A_tempMin) > parseFloat(A_tempMax)) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = `JAR A Temp min > JAR A Temp max`;
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }

                            }
                            else {
                                let B_tempMin = tempmin[0].B_tempMin
                                let B_tempMax = tempmax[0].B_tempMax
                                if (parseFloat(B_tempMin) > parseFloat(B_tempMax)) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = `JAR B Temp min > JAR B Temp max`;
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }

                        }
                        else {
                            let B_tempMin = tempmin[0].B_tempMin
                            let B_tempMax = tempmax[0].B_tempMax
                            let A_tempMin = tempmin[0].A_tempMin
                            let A_tempMax = tempmax[0].A_tempMax

                            if (parseFloat(A_tempMin) > parseFloat(A_tempMax) || parseFloat(B_tempMin) > parseFloat(B_tempMax)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = `JAR A or B Temp min > JAR A or B Temp max`;
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }


                        }


                        var signature = actualProtocol;
                        //globalData.arrDTData.push(signature);
                        bulkDataFlag.flgDTFlag = false;

                    }
                }


                return tdValue;
            }
            else {
                /**
                * @description We are here setting TD000 and HD000 to true
                */
                globalData.arrTDTData = []
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                globalData.arrJARTypeDT.sapoflg = false
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                console.log(tempTDHD)
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
                    //let tempDTData = globalData.arrDTData.find(td => td.idsNo == IdsNo);

                    if ((objInvalid != undefined && objInvalid.DT.invalid == true) || tempTDObj.arr_heading.length != 5) {
                        /**
                         * @description HERE WE MUST EMPTY `arr_heading` AND `arr_reading` after invalid data
                         * because array may contain invalid data
                         */

                        var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                        if (tempTDObj == undefined) {
                            globalData.arrDTData.push({
                                idsNo: idsNo, arr_heading: [], arr_reading: [], arr_info: [],
                                rotaryType: undefined,
                                mode: undefined,
                                Bath_Temp: undefined,
                                bsetdata: undefined,


                            })
                        } else {
                            tempTDObj.arr_heading = [];
                            tempTDObj.arr_reading = [];
                            tempTDObj.arr_info = [];
                            tempTDObj.rotaryType = undefined;
                            tempTDObj.mode = undefined;
                            tempTDObj.Bath_Temp = undefined;
                            tempTDObj.bsetdata = undefined;


                        }
                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'DT', flag: 'ABORTED' } });
                        objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', '', 'ended');
                        return `${protocolIncomingType}R40Invalid String,,,,`
                        //return `${protocolIncomingType}R40INVALID DATA,RECEIVED,RETRANSMIT DATA,,`

                    }
                    else {

                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'DT', flag: 'COMPLETED' } });
                        let now = new Date();
                        let tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                        var productlimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
                        console.log(tempDTObj);
                        var newDTData = tempDTObj.arr_heading;
                        var newArrayReading = tempDTObj.arr_reading;
                        var newArrayInfo = tempDTObj.arr_info;
                        var startDate = newArrayInfo[0].A_startDate;
                        startDate = startDate.split("/").reverse().join("-");
                        //var newArrayReading = newDTReading.slice(0, -1);//to remove undefine from array
                        var checkType = protocol.split(',');
                        var responseType = checkType[3].split("");
                        var actualResponseType = responseType[0];
                        var jarA = [], jarB = [];


                        if (newDTData.length != 0) {

                            for (let i = 0; i < newArrayReading.length; i++) {
                                jarA.push(newArrayReading[i].A);
                                jarB.push(newArrayReading[i].B);
                            }

                            var jarType;
                            var timeStatus; // 
                            var endDate;
                            var startTime;
                            var endTime;
                            // == 
                            if (productObj.Sys_RotaryType == 'Single') {
                                var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                                if (objJARTypeDT.JarType == "A") {
                                    jarType = "A";
                                    //Added on 05/09/2020 taking date and time from string for A
                                    startTime = newDTData[0].A_st;
                                    endTime = newDTData[1].A_et;
                                    var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                    var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                    endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                                }
                                else {
                                    jarType = "B";
                                    //Added on 05/09/2020 taking date and time from string for B
                                    startTime = newDTData[0].B_st;
                                    endTime = newDTData[1].B_et;
                                    var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                    var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                    endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                                }
                            } else {
                                //Added on 05/09/2020 taking date and time from string for A (Double Rotory)
                                startTime = newDTData[0].A_st;
                                endTime = newDTData[1].A_et;
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                            }

                            var le, actualRunTime, completeTable, detailTable;
                            if (ProductType.productType == 2 && (productObj.Sys_Area == 'Pallet Coating' || productObj.Sys_Area == 'Coating')) {
                                productObj.Sys_Area = 'Capsule Filling';
                                var res = await objProduct.productData(productObj);
                                productObj.Sys_Area = 'Pallet Coating';
                            } else {
                                var res = await objProduct.productData(productObj);
                            }

                            actualRunTime = ProductType.productType == 1 ? res[1].Param13_Nom : res[1].Param6_Nom;
                            completeTable = ProductType.productType == 1 ? 'tbl_tab_master13' : 'tbl_cap_master6';
                            detailTable = ProductType.productType == 1 ? 'tbl_tab_detail13' : 'tbl_cap_detail6';
                            var DTJAR = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                            //var jartype = `jar${objJARTypeDT.JarType}`;
                            var masterCompleteData = {
                                str_tableName: completeTable,
                                data: [
                                    { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                    { str_colName: 'InstruId', value: 1 },
                                    { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                    { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                    { str_colName: 'ProductType', value: ProductType.productType },
                                    // { str_colName: 'Qty', value: productlimits.DT.noOfSamples },
                                    { str_colName: 'Qty', value: 6 },
                                    { str_colName: 'Idsno', value: IdsNo },
                                    { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                    { str_colName: 'BalanceId', value: currentCubicleObj.Sys_BalID },
                                    { str_colName: 'VernierId', value: currentCubicleObj.Sys_VernierID },
                                    { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                    { str_colName: 'UserId', value: tempUserObject.UserId },
                                    { str_colName: 'UserName', value: tempUserObject.UserName },
                                    { str_colName: 'PrDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : startDate },
                                    { str_colName: 'PrTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : startTime },
                                    { str_colName: 'PrEndDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : endDate },
                                    { str_colName: 'PrEndTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : endTime },
                                    { str_colName: 'Side', value: productObj.Sys_RotaryType == 'Single' ? (jarType == "A") ? "NA" : "NA" : "LHS" },
                                    { str_colName: 'WgmtModeNo', value: 13 },
                                    { str_colName: 'Nom', value: ProductType.productType == 1 ? res[1].Param13_Nom : res[1].Param6_Nom },
                                    { str_colName: 'T1NegTol', value: ProductType.productType == 1 ? res[1].Param13_T1Neg : res[1].Param6_T1Neg },
                                    { str_colName: 'T1PosTol', value: ProductType.productType == 1 ? res[1].Param13_T1Pos : res[1].Param6_T1Pos },
                                    { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                    { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                    { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                    { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                    { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                    { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                    { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                    { str_colName: 'RepoLabel11', value: currentCubicleObj.Sys_Validation },
                                    { str_colName: 'PrintNo', value: 0 },
                                    { str_colName: 'IsArchived', value: 0 },
                                    { str_colName: 'GraphType', value: 0 },
                                    { str_colName: 'BatchComplete', value: 0 },
                                    { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                    { str_colName: 'Version', value: productObj.Sys_Version },
                                    { str_colName: 'DTID', value: currentCubicleObj.Sys_DTID },
                                    { str_colName: 'Media', value: productObj.Sys_media },
                                    { str_colName: 'Lot', value: objLotData.LotNo },
                                    { str_colName: 'Area', value: productObj.Sys_Area },
                                    { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                    { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                    { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                    { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                    { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                                    { str_colName: 'DT_Mode', value: tempDTObj.mode == undefined ? 'Registration' : tempDTObj.mode },
                                    { str_colName: 'DT_BasketType', value: tempDTObj.basketType },
                                    { str_colName: 'DT_Jar', value: DTJAR.JarType },
                                    { str_colName: 'DT_SetTemp', value: tempDTObj.Bath_Temp },
                                ]
                            }

                            if (jarType == "A") {
                                masterCompleteData.data.push(

                                    { str_colName: 'MinTemp', value: newDTData[3].A_tempMin },
                                    { str_colName: 'MaxTemp', value: newDTData[4].A_tempMax },

                                );
                            }
                            else if (jarType == "B") {
                                masterCompleteData.data.push(

                                    { str_colName: 'MinTemp', value: newDTData[3].B_tempMin },
                                    { str_colName: 'MaxTemp', value: newDTData[4].B_tempMax },

                                );
                            }
                            else {
                                masterCompleteData.data.push(

                                    { str_colName: 'MinTemp', value: newDTData[3].A_tempMin },
                                    { str_colName: 'MaxTemp', value: newDTData[4].A_tempMax },

                                );
                            }
                            //console.log(masterCompleteData);
                            var resultCompleteData = await database.save(masterCompleteData);
                            var lastInsertedID = resultCompleteData[0].insertId;

                            if (jarType == "A") {
                                var startTime = newDTData[0].A_st.trim();
                                var endTime = newDTData[1].A_et.trim();
                                var startTimeval = moment(startTime, 'HH:mm:ss');
                                var endTimeval = moment(endTime, 'HH:mm:ss');
                                var runTime = moment.utc(moment(endTimeval, "HH:mm:ss")
                                    .diff(moment(startTimeval, "HH:mm:ss"))).format("HH:mm:ss")
                                var hDur = newDTData[2].A_hd.trim();

                                for (const [i, dtVal] of jarA.entries()) {

                                    var endTmSS = moment(startTime, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObj = {
                                        str_tableName: detailTable,
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedID },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: "NA" },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            // { str_colName: 'DT_Temp', value: 0 },
                                            { str_colName: 'DT_Temp', value: newDTData[4].A_tempMax },//as discussed with sheetal and shraddhanad for hosure
                                            { str_colName: 'DT_StartTm', value: startTime },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            // { str_colName: 'DT_RunTime', value: runTime },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDur }
                                        ]
                                    }
                                    //console.log(insertDetailObj);
                                    var jarARes = await database.save(insertDetailObj);
                                }


                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;


                                var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {
                                    var returnBatchRes = await objBatchSummary.saveBatchSummaryDT(lastInsertedID, 0, productObj, IdsNo);
                                }
                                var objUpdateValidation = {
                                    str_tableName: "tbl_cubical",
                                    data: [
                                        { str_colName: 'Sys_Validation', value: 0 },
                                    ],
                                    condition: [
                                        { str_colName: 'Sys_IDSNo', value: IdsNo },
                                    ]
                                }
                                await database.update(objUpdateValidation);
                                // //Online printing code of Jar B 
                                // const objIOnlinePrint = new IOnlinePrint();
                                // objIOnlinePrint.RepSerNo = lastInsertedID;
                                // objIOnlinePrint.reportOption = "Disintegration Tester";
                                // objIOnlinePrint.testType = "Regular";
                                // objIOnlinePrint.userId = tempUserObject.UserId;
                                // objIOnlinePrint.username = tempUserObject.UserName;
                                // objIOnlinePrint.idsNo = IdsNo
                                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

                                // await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
                                le = `${protocolIncomingType}` + `R1`;
                                var tempFlagAJar = false; // For time
                                var tempFlagTemp = false // for Tempreture
                                for (const [i, dtVal] of jarA.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        // return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }
                                if ((parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].A_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].A_tempMax))) {
                                    tempFlagTemp = true;
                                }
                                if (tempFlagTemp == true || tempFlagAJar == true) {
                                    le = `${protocolIncomingType}` + `R2`;
                                }
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'DT Weighment Completed on IDS' + IdsNo });
                                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                                objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', 'DT', 'completed');
                                //empty object when data is completly saved 
                                var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                                if (tempTDObj == undefined) {
                                    globalData.arrDTData.push({
                                        idsNo: IdsNo, arr_heading: [], arr_reading: [], arr_info: [],
                                        rotaryType: undefined,
                                        mode: undefined,
                                        basketType: undefined,
                                        Bath_Temp: undefined

                                    })
                                } else {
                                    tempTDObj.arr_heading = [];
                                    tempTDObj.arr_reading = [];
                                    tempTDObj.arr_info = [];
                                    tempTDObj.rotaryType = undefined;
                                    tempTDObj.mode = undefined;
                                    tempTDObj.basketType = undefined;
                                    tempTDObj.Bath_Temp = undefined;

                                }
                                return le;

                            }
                            else if (jarType == "B") {
                                var startTime = newDTData[0].B_st.trim();
                                var endTime = newDTData[1].B_et.trim();
                                var startTimeval = moment(startTime, 'HH:mm:ss');
                                var endTimeval = moment(endTime, 'HH:mm:ss');
                                var runTime = moment.utc(moment(endTimeval, "HH:mm:ss")
                                    .diff(moment(startTimeval, "HH:mm:ss"))).format("HH:mm:ss")
                                var hDur = newDTData[2].B_hd.trim();

                                for (const [i, dtVal] of jarB.entries()) {

                                    var endTmSS = moment(startTime, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObj = {
                                        str_tableName: detailTable,
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedID },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: jarType == "NA" },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            { str_colName: 'DT_Temp', value: newDTData[4].B_tempMax },
                                            { str_colName: 'DT_StartTm', value: startTime },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDur }
                                        ]
                                    }

                                    var jarBRes = await database.save(insertDetailObj);


                                }

                                var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {
                                    var returnBatchRes = await objBatchSummary.saveBatchSummaryDT(lastInsertedID, 0, productObj, IdsNo);
                                }
                                var objUpdateValidation = {
                                    str_tableName: "tbl_cubical",
                                    data: [
                                        { str_colName: 'Sys_Validation', value: 0 },
                                    ],
                                    condition: [
                                        { str_colName: 'Sys_IDSNo', value: IdsNo },
                                    ]
                                }
                                await database.update(objUpdateValidation);
                                //Online printing code of Jar B 
                                // const objIOnlinePrint = new IOnlinePrint();
                                // objIOnlinePrint.RepSerNo = lastInsertedID;
                                // objIOnlinePrint.reportOption = "Disintegration Tester";
                                // objIOnlinePrint.testType = "Regular";
                                // objIOnlinePrint.userId = tempUserObject.UserId;
                                // objIOnlinePrint.username = tempUserObject.UserName;
                                // objIOnlinePrint.idsNo = IdsNo
                                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

                                // await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'DT Weighment Completed on IDS' + IdsNo });
                                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                                objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', 'DT', 'completed');
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;


                                le = `${protocolIncomingType}` + `R1`;
                                var tempFlagAJar = false; // For time
                                var tempFlagTemp = false // for Tempreture
                                for (const [i, dtVal] of jarB.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        //return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }
                                if ((parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].B_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].B_tempMax))) {
                                    tempFlagTemp = true;
                                }
                                if (tempFlagTemp == true || tempFlagAJar == true) {
                                    le = `${protocolIncomingType}` + `R2`;
                                }
                                //empty object when data is completly saved 
                                var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                                if (tempTDObj == undefined) {
                                    globalData.arrDTData.push({
                                        idsNo: IdsNo, arr_heading: [], arr_reading: [], arr_info: [],
                                        rotaryType: undefined,
                                        mode: undefined,
                                        basketType: undefined,
                                        Bath_Temp: undefined



                                    })
                                } else {
                                    tempTDObj.arr_heading = [];
                                    tempTDObj.arr_reading = [];
                                    tempTDObj.arr_info = [];
                                    tempDTObj.rotaryType = undefined;
                                    tempDTObj.mode = undefined;
                                    tempTDObj.basketType = undefined;
                                    tempTDObj.Bath_Temp = undefined;

                                }
                                return le;

                            }
                            else {

                                // var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                                // if (objJARTypeDT.JarType == "A") {
                                //     jarType = "A";
                                // }
                                // else {
                                //     jarType = "B";
                                // }

                                var startTimeA = newDTData[0].A_st.trim();
                                var endTimeA = newDTData[1].A_et.trim();
                                var startTimevalA = moment(startTimeA, 'HH:mm:ss');
                                var endTimevalA = moment(endTimeA, 'HH:mm:ss');
                                var runTimeA = moment.utc(moment(endTimevalA, "HH:mm:ss")
                                    .diff(moment(startTimevalA, "HH:mm:ss"))).format("HH:mm:ss")
                                var hDurA = newDTData[2].A_hd.trim();

                                var startTimeB = newDTData[0].B_st.trim();
                                var endTimeB = newDTData[1].B_et.trim();
                                var startTimevalB = moment(startTimeB, 'HH:mm:ss');
                                var endTimevalB = moment(endTimeB, 'HH:mm:ss');
                                var runTimeB = moment.utc(moment(endTimevalB, "HH:mm:ss")
                                    .diff(moment(startTimevalB, "HH:mm:ss"))).format("HH:mm:ss");
                                var hDurB = newDTData[2].B_hd.trim();



                                for (const [i, dtVal] of jarA.entries()) {
                                    var endTmSS = moment(startTimeA, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObjA = {
                                        str_tableName: detailTable,
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedID },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: 'LHS' },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            { str_colName: 'DT_Temp', value: newDTData[4].A_tempMax },
                                            { str_colName: 'DT_StartTm', value: startTimeA },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            //{ str_colName: 'DT_RunTime', value: runTimeA },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDurA }
                                        ]
                                    }
                                    var ResJarA = await database.save(insertDetailObjA);

                                }
                                //Online printing code of Jar A 
                                // const objIOnlinePrintA = new IOnlinePrint();
                                // objIOnlinePrintA.RepSerNo = lastInsertedID;
                                // objIOnlinePrintA.reportOption = "Disintegration Tester";
                                // objIOnlinePrintA.testType = "Regular";
                                // objIOnlinePrintA.userId = tempUserObject.UserId;
                                // objIOnlinePrintA.username = tempUserObject.UserName;
                                // objIOnlinePrintA.idsNo = IdsNo
                                // const objPrinterNameA = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                // const a = await objPrintReport.generateOnlineReportAsync(objIOnlinePrintA, objPrinterNameA.Sys_PrinterName)
                                startTime = newDTData[0].B_st;
                                endTime = newDTData[1].B_et;
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                                var JARDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                                var templimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
                                /* inserting Data of double rotatry for B*/
                                var masterCompleteDataJarB = {
                                    str_tableName: completeTable,
                                    data: [
                                        { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                        { str_colName: 'InstruId', value: 1 },
                                        { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                        { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                        { str_colName: 'ProductType', value: ProductType.productType },
                                        // { str_colName: 'Qty', value: templimits.DT.noOfSamples },
                                        { str_colName: 'Qty', value: 6 },
                                        { str_colName: 'Idsno', value: IdsNo },
                                        { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                        { str_colName: 'BalanceId', value: currentCubicleObj.Sys_BalID },
                                        { str_colName: 'VernierId', value: currentCubicleObj.Sys_VernierID },
                                        { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                        { str_colName: 'UserId', value: tempUserObject.UserId },
                                        { str_colName: 'UserName', value: tempUserObject.UserName },
                                        { str_colName: 'PrDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : startDate },
                                        { str_colName: 'PrTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : startTime },
                                        { str_colName: 'PrEndDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : endDate },
                                        { str_colName: 'PrEndTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : endTime },
                                        { str_colName: 'Side', value: 'RHS' },
                                        { str_colName: 'Lot', value: objLotData.LotNo },
                                        { str_colName: 'WgmtModeNo', value: 13 },
                                        { str_colName: 'Nom', value: ProductType.productType == 1 ? res[1].Param13_Nom : res[1].Param6_Nom },
                                        { str_colName: 'T1NegTol', value: ProductType.productType == 1 ? res[1].Param13_T1Neg : res[1].Param6_T1Neg },
                                        { str_colName: 'T1PosTol', value: ProductType.productType == 1 ? res[1].Param13_T1Pos : res[1].Param6_T1Pos },
                                        { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                        { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                        { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                        { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                        { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                        { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                        { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                        { str_colName: 'RepoLabel11', value: currentCubicleObj.Sys_Validation },
                                        { str_colName: 'PrintNo', value: 0 },
                                        { str_colName: 'IsArchived', value: 0 },
                                        { str_colName: 'GraphType', value: 0 },
                                        { str_colName: 'BatchComplete', value: 0 },
                                        { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                        { str_colName: 'Version', value: productObj.Sys_Version },
                                        { str_colName: 'MinTemp', value: newDTData[3].B_tempMin },
                                        { str_colName: 'MaxTemp', value: newDTData[4].B_tempMax },
                                        { str_colName: 'DTID', value: currentCubicleObj.Sys_DTID },
                                        { str_colName: 'Media', value: productObj.Sys_media },
                                        { str_colName: 'Area', value: productObj.Sys_Area },
                                        { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                        { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                        { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                        { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                        { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                                        { str_colName: 'DT_Mode', value: tempDTObj.mode == undefined ? 'Registration' : tempDTObj.mode },
                                        { str_colName: 'DT_BasketType', value: tempDTObj.basketType },
                                        { str_colName: 'DT_Jar', value: "B" },
                                        { str_colName: 'DT_SetTemp', value: tempDTObj.bsetdata },
                                    ]
                                }
                                var resultCompleteDataJarB = await database.save(masterCompleteDataJarB);

                                var lastInsertedIDJarB = resultCompleteDataJarB[0].insertId;
                                for (const [i, dtVal] of jarB.entries()) {
                                    var endTmSS = moment(startTimeB, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObjB = {
                                        str_tableName: detailTable,
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedIDJarB },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: 'RHS' },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            { str_colName: 'DT_Temp', value: newDTData[4].B_tempMax },
                                            { str_colName: 'DT_StartTm', value: startTimeB },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            //{ str_colName: 'DT_RunTime', value: runTimeB },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDurB }
                                        ]
                                    }

                                    var ResDetailB = await database.save(insertDetailObjB);

                                }
                                /* end of  inserting Data of double rotatry for B*/



                                var objUpdateValidation = {
                                    str_tableName: "tbl_cubical",
                                    data: [
                                        { str_colName: 'Sys_Validation', value: 0 },
                                    ],
                                    condition: [
                                        { str_colName: 'Sys_IDSNo', value: IdsNo },
                                    ]
                                }


                                var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {
                                    var returnBatchRes = await objBatchSummary.saveBatchSummaryDT(lastInsertedID, lastInsertedIDJarB, productObj, IdsNo);
                                }

                                var resValidation = await database.update(objUpdateValidation);
                                // Activity Log for DT weighmnet Completed
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'DT Weighment Completed on IDS' + IdsNo });
                                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                                // Instrument usage for DT complete
                                objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', '', 'completed')




                                //Online printing code of Jar B 


                                //   if (a == true) {
                                // const objIOnlinePrintB = new IOnlinePrint();
                                // objIOnlinePrintB.RepSerNo = lastInsertedIDJarB;
                                // objIOnlinePrintB.reportOption = "Disintegration Tester";
                                // objIOnlinePrintB.testType = "Regular";
                                // objIOnlinePrintB.userId = tempUserObject.UserId;
                                // objIOnlinePrintB.username = tempUserObject.UserName;
                                // objIOnlinePrintB.idsNo = IdsNo
                                // const objPrinterNameB = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

                                // const b = await objPrintReport.generateOnlineReportAsync(objIOnlinePrintB, objPrinterNameB.Sys_PrinterName);
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                // if ((parseInt(actualRunTime.replace(regExp, "$1$2$3")) > parseInt(runTimeA.replace(regExp, "$1$2$3")))
                                //     && (parseInt(actualRunTime.replace(regExp, "$1$2$3")) > parseInt(runTimeB.replace(regExp, "$1$2$3")))) {
                                //     return le = `${protocolIncomingType}` + `R1`;
                                // } else {
                                //     return le = `${protocolIncomingType}` + `R2`;
                                // }
                                //  }

                                le = `${protocolIncomingType}` + `R1`

                                var tempFlagAJar = false; // For time
                                var tempFlagTemp = false // for Tempreture
                                for (const [i, dtVal] of jarA.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        // return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }


                                for (const [i, dtVal] of jarB.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        // return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }

                                if ((parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].A_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].B_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].A_tempMax)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].B_tempMax))) {
                                    tempFlagTemp = true;
                                }
                                if (tempFlagTemp == true || tempFlagAJar == true) {
                                    le = `${protocolIncomingType}` + `R2`;
                                }
                                //empty object when data is completly saved 
                                var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                                if (tempTDObj == undefined) {
                                    globalData.arrDTData.push({
                                        idsNo: idsNo, arr_heading: [], arr_reading: [], arr_info: [],
                                        rotaryType: undefined,
                                        mode: undefined,
                                        Bath_Temp: undefined,
                                    })
                                } else {
                                    tempTDObj.arr_heading = [];
                                    tempTDObj.arr_reading = [];
                                    tempTDObj.arr_info = [];
                                    tempDTObj.rotaryType = undefined;
                                    tempDTObj.mode = undefined;
                                    tempDTObj.Bath_Temp = undefined;
                                }
                                return le;


                            }
                            //batch Summary record
                        }


                    }
                } else {
                    console.log('REPEAT_COUNT FOR TDHD000');
                    return '+';
                }

            }// else ends

        } catch (err) {
            var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
            if (tempTDObj == undefined) {
                globalData.arrDTData.push({ idsNo: idsNo, arr_heading: [], arr_reading: [], arr_info: [], rotaryType: undefined, mode: undefined })
            } else {
                tempTDObj.arr_heading = [];
                tempTDObj.arr_reading = [];
                tempTDObj.arr_info = [];
                tempTDObj.rotaryType = undefined;
                tempTDObj.mode = undefined;
                tempTDObj.Bath_Temp = undefined;

            }
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log(err);
        }

    }
    async insertBulkWeighmentDT(IdsNo, protocol, DTModel) {
        try {

            var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var currentCubicleObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var selectedIds;
            var ModeType;// dual mode or registration mode
            var ModeType1;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var actualProtocol = protocol;
            var tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var tdValue = actualProtocol.substring(0, 5);
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var objArrLimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
            var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
            var protocolIncomingType = tdValue.substring(0, 1);//Check incoming Protocol is from "T" or "H"

            globalData.arrTDTData.push({
                strsettemp: [],
                ediflg: false
            })


            if (tdValue != "TD000" && tdValue != "HD000" && tdValue != "ED000") {
                /**
                * @description We are here setting TD000 and HD000 to false
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }
                /************************************************************* */

                var bulkDataFlag = globalData.arrBulkDataFlag.find(k => k.IdsNo == IdsNo);
                var tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);

                var sample_recived = false;

                var jarType = "A";

                var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                if (objJARTypeDT != undefined) {
                    if (objJARTypeDT.JarType == "A") {
                        jarType = "A";
                    }
                    else {
                        jarType = "B";
                    }
                }
                var BathTemp = actualProtocol.includes("SET BATH TEMP")


                if (BathTemp == true) {

                    var temp = actualProtocol.split(':')[2].trim();
                    temp = temp.replace(/[\sNRrn]+/g, "|");
                    temp = temp.split("|")[0];
                    tempDTObj.Bath_Temp = temp;
                    if (productObj.Sys_RotaryType == "Double") {
                        tempDTObj.bsetdata = temp
                    }
                }

                if (actualProtocol.includes("SET TEMP") && (actualProtocol.includes("BATH") == false)) {


                    globalData.arrTDTData[0].ediflg = true

                    globalData.arrTDTData[0].strsettemp = actualProtocol


                }

                var Model = (actualProtocol.includes("MODEL") || actualProtocol.includes("Model No"));
                if (Model == true) {
                    var prepend = 'Electrolab ';
                    const objBulkInvalid = new bulkInvalid();
                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                    objBulkInvalid.invalidObj.DT.invalid = false;
                    objBulkInvalid.invalidObj.DT.invalidMsg = "";
                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                    var model_name = actualProtocol.split(':')[1].trim();
                    var strModel_name = model_name.split(' ')[0].toString();
                    var Model = prepend.concat(strModel_name);


                    if (Model.includes('ED3PO')) {

                        // const objBulkInvalid = new bulkInvalid();
                        // objBulkInvalid.invalidObj.idsNo = IdsNo;
                        // objBulkInvalid.invalidObj.DT.invalid = true;
                        // objBulkInvalid.invalidObj.DT.invalidMsg = `DATA RECEIVED from ${{ strModel_name }} INSTED OF  ${{ DTModel }}`;
                        // Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'DT', flag: 'ABORTED' } });
                        return `${protocolIncomingType}R40Invalid String,,,,`
                    }


                }

                var testSummaryVal = actualProtocol.includes("Start Date");
                if (testSummaryVal == true) {
                    let tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                    bulkDataFlag.flgDTFlag = true;
                    // Activity Log for DT weighmnet started
                    var objActivity = {};
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'DT Weighment Started on IDS' + IdsNo });
                    objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });


                    // Instrument usage for DT start
                    objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', 'DT', 'started');
                    // Added on 04-09-2020 to support date complication by pradip
                    var str_startDate = actualProtocol.split('Date:')[1].includes('N') == true ? actualProtocol.split('Date:')[1].split('N') : actualProtocol.split('Date:')[1].split('R')[0].trim();
                    str_startDate = str_startDate[0].trim();

                    //
                    //    var format1 = moment(str_startDate, "YYYY/MM/DD", true).isValid();
                    //    var format2 = moment(str_startDate, "DD/MM/YYYY", true).isValid();
                    //    if (format1 || format2) {
                    //        console.log("startdate is ok ")
                    //    } else {
                    //        const BulkInvalid = new bulkInvalid();
                    //        BulkInvalid.invalidObj.idsNo = IdsNo;
                    //        BulkInvalid.invalidObj.DT.invalid = true;
                    //        BulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED START DATE,IS NOT VALID";
                    //        Object.assign(objInvalid, BulkInvalid.invalidObj);

                    //    }
                    //


                    var stDateObj = { "A_startDate": str_startDate, "B_startDate": str_startDate };
                    //globalData.arrDTData.push(stObj);
                    tempDTObj.arr_info.push(stDateObj);
                    // const objBulkInvalid = new bulkInvalid();
                    // objBulkInvalid.invalidObj.idsNo = IdsNo;
                    // objBulkInvalid.invalidObj.DT.invalid = false;
                    // objBulkInvalid.invalidObj.DT.invalidMsg = "";
                    // Object.assign(objInvalid, objBulkInvalid.invalidObj);
                }
                if (bulkDataFlag.flgDTFlag == true) {

                    var testStartTime = actualProtocol.includes("START TIME");
                    if (testStartTime == true) {
                        var startTime = actualProtocol;
                        if (actualProtocol.split("|")[1].trim())
                            var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);


                        var jartypeST = actualProtocol.split("|")[1].trim().match(/\d+/g) == null ? obJARTypeDT.JarType = "B" : obJARTypeDT.JarType = "A"


                        if (productObj.Sys_RotaryType == 'Single' && jartypeST == "A") {

                            if (!moment(startTime.split("|")[1].trim(), TimeFormat, true).isValid()) {

                                const BulkInvalid = new bulkInvalid();
                                BulkInvalid.invalidObj.idsNo = IdsNo;
                                BulkInvalid.invalidObj.DT.invalid = true;
                                BulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A START TIME,IS NOT VALID";
                                Object.assign(objInvalid, BulkInvalid.invalidObj);

                            }

                        }
                        else if (productObj.Sys_RotaryType == 'Single' && jartypeST == "B") {

                            if (!moment(startTime.split("|")[2].trim(), TimeFormat, true).isValid()) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B START TIME,IS NOT VALID";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                        }
                        else {
                            // Check the time value is valid or not 
                            if (!moment(startTime.split("|")[1].trim(), TimeFormat, true).isValid() && objInvalid.DT.invalid == false) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A START TIME,IS NOT VALID";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }
                            if (!moment(startTime.split("|")[2].trim(), TimeFormat, true).isValid() && objInvalid.DT.invalid == false) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B START TIME,IS NOT VALID";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                        }

                        var stObj = { "A_st": startTime.split("|")[1].trim(), "B_st": startTime.split("|")[2].trim() };
                        //globalData.arrDTData.push(stObj);
                        tempDTObj.arr_heading.push(stObj);
                    }

                    var testEndTime = actualProtocol.includes("END TIME");
                    if (testEndTime == true) {
                        var endTime = actualProtocol;
                        var JARTypeobj = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                        var jar = actualProtocol.split("|")[1].trim().match(/\d+/g) == null ? JARTypeobj.JarType = "B" : JARTypeobj.JarType = "A"

                        if (productObj.Sys_RotaryType == 'Single' && jar == "A") {

                            if (!moment(endTime.split("|")[1].trim(), TimeFormat, true).isValid()
                            ) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A END TIME,IS NOT VALID";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                        }
                        else if (productObj.Sys_RotaryType == 'Single' && jar == "B") {

                            if (!moment(endTime.split("|")[2].trim(), TimeFormat, true).isValid()
                            ) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B END TIME,IS NOT VALID";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                        }
                        else {
                            if (!moment(endTime.split("|")[1].trim(), TimeFormat, true).isValid() && objInvalid.DT.invalid == false) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A END TIME,IS NOT VALID";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                            if (!moment(endTime.split("|")[2].trim(), TimeFormat, true).isValid() && objInvalid.DT.invalid == false) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B END TIME,IS NOT VALID";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                        }


                        var etObj = { "A_et": endTime.split("|")[1].trim(), "B_et": endTime.split("|")[2].trim() };
                        //globalData.arrDTData.push(etObj);
                        tempDTObj.arr_heading.push(etObj);
                    }


                    var str_modes = actualProtocol.includes("MODE");
                    if (str_modes == true) {
                        //  ModeType1 = actualProtocol.replace(/[NRrn]+/g, ":").trim();
                        ModeType1 = actualProtocol.split("MODE")[1].trim();
                        ModeType1 = ModeType1.substring(1, ModeType1.length - 2).trim()
                        if (isNaN(ModeType1) && ModeType1 != " " && (ModeType1 == 'Registration' || ModeType1 == 'Dual Timer')) {
                            if (ModeType1 == 'Dual Timer') {
                                tempDTObj.mode = 'Dual'
                            }
                            else {
                                tempDTObj.mode = ModeType1
                            }

                        }
                        else {

                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,MODE IS NOT VALID";
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }

                        console.log(ModeType1);
                    }
                    // var str_mode = actualProtocol.includes("Dual");
                    // if (str_mode == true) {
                    //     ModeType = actualProtocol.split(":")[1].trim();
                    //     ModeType = ModeType.substring(0, 4);
                    //     tempDTObj.mode = 'Dual'

                    // }

                    var testBasketType = actualProtocol.includes("BASKET TYPE ");

                    if (testBasketType == true) {
                        var basketA = actualProtocol.split("|")[1].trim()
                        tempDTObj.basketType = basketA;
                    }


                    var testDurTime = actualProtocol.includes("TEST ON DUR");
                    if (testDurTime == true) {
                        var durTime = actualProtocol;

                    }

                    if (testDurTime) {
                        if (tempDTObj.mode == 'Dual') {
                            var sample = actualProtocol;
                            var jar = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                            if (productObj.Sys_RotaryType == 'Single' && jar.JarType == "A") {
                                if (!moment(sample.split("|")[1].trim(), TimeFormat, true).isValid()) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,DURATION TIME,IS NOT VALID";

                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);

                                }
                            } else if (productObj.Sys_RotaryType == 'Single' && jar.JarType == "B") {
                                if (!moment(sample.split("|")[2].trim(), TimeFormat, true).isValid()) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,DURATION TIME,IS NOT VALID";

                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);

                                }
                            } else {
                                if (!moment(sample.split("|")[1].trim(), TimeFormat, true).isValid()) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,DURATION TIME,IS NOT VALID";

                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);

                                }
                                if (!moment(sample.split("|")[2].trim(), TimeFormat, true).isValid()) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,DURATION TIME,IS NOT VALID";

                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);

                                }
                            }
                            var sample1 = { "A": sample.split("|")[1].trim(), "B": sample.split("|")[2].trim() };
                            //globalData.arrDTDataReading.push(c1Obj);
                            if (sample1.A != undefined && sample1.B != undefined) {
                                tempDTObj.arr_reading.push(sample1);
                            }
                        }
                    }
                    var JARTypeobj = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                    var count1 = actualProtocol.includes("1. ");
                    if (count1 == true) {
                        var countOne = actualProtocol;
                        if (countOne.split("|")[1].trim().split(':').length >= 4 || (countOne.split("|")[2].trim().split(':').length >= 4)) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        } else {
                            await this.validateTwoSaTime(countOne, productObj, JARTypeobj, IdsNo);
                            var c1Obj = { "A": countOne.split("|")[1], "B": countOne.split("|")[2] };
                            //globalData.arrDTDataReading.push(c1Obj);
                            if (c1Obj.A != undefined && c1Obj.B != undefined) {
                                tempDTObj.arr_reading.push(c1Obj);
                            }
                        }

                    }
                    var count2 = actualProtocol.includes("2. ");
                    if (count2 == true) {
                        var countTwo = actualProtocol;

                        //globalData.arrDTDataReading.push(c2Obj);


                        if (countTwo.split("|")[1].trim().split(':').length >= 4 || (countTwo.split("|")[2].trim().split(':').length >= 4)) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }
                        else {
                            var c2Obj = { "A": countTwo.split("|")[1], "B": countTwo.split("|")[2] };
                            await this.validateTwoSaTime(countTwo, productObj, JARTypeobj, IdsNo);
                            if (c2Obj.A != undefined && c2Obj.B != undefined) {
                                tempDTObj.arr_reading.push(c2Obj);
                            }
                        }
                    }
                    var count3 = actualProtocol.includes("3. ");
                    if (count3 == true) {
                        var countThree = actualProtocol;

                        //globalData.arrDTDataReading.push(c3Obj);

                        if (countThree.split("|")[1].trim().split(':').length >= 4 || (countThree.split("|")[2].trim().split(':').length >= 4)) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }
                        else {
                            var c3Obj = { "A": countThree.split("|")[1], "B": countThree.split("|")[2] };
                            await this.validateTwoSaTime(countThree, productObj, JARTypeobj, IdsNo);
                            if (c3Obj.A != undefined && c3Obj.B != undefined) {
                                tempDTObj.arr_reading.push(c3Obj);
                            }
                        }


                    }
                    var count4 = actualProtocol.includes("4. ");
                    if (count4 == true) {


                        var countFour = actualProtocol;


                        if (countFour.split("|")[1].trim().split(':').length >= 4 || (countFour.split("|")[2].trim().split(':').length >= 4)) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }

                        else {
                            var c4Obj = { "A": countFour.split("|")[1], "B": countFour.split("|")[2] };
                            //globalData.arrDTDataReading.push(c4Obj);
                            await this.validateTwoSaTime(countFour, productObj, JARTypeobj, IdsNo);
                            if (c4Obj.A != undefined && c4Obj.B != undefined) {
                                tempDTObj.arr_reading.push(c4Obj);
                            }
                        }


                    }
                    var count5 = actualProtocol.includes("5. ");
                    if (count5 == true) {
                        var countFive = actualProtocol;

                        if (countFive.split("|")[1].trim().split(':').length >= 4 || (countFive.split("|")[2].trim().split(':').length >= 4)) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }
                        else {
                            var c5Obj = { "A": countFive.split("|")[1], "B": countFive.split("|")[2] };
                            //globalData.arrDTDataReading.push(c5Obj);
                            await this.validateTwoSaTime(countFive, productObj, JARTypeobj, IdsNo);
                            if (c5Obj.A != undefined && c5Obj.B != undefined) {
                                tempDTObj.arr_reading.push(c5Obj);
                            }
                        }

                    }
                    var count6 = actualProtocol.includes("6. ");
                    if (count6 == true) {
                        var countSix = actualProtocol;

                        if (countSix.split("|")[1].trim().split(':').length >= 4 || (countSix.split("|")[2].trim().split(':').length >= 4)) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }
                        else {
                            var c6Obj = { "A": countSix.split("|")[1], "B": countSix.split("|")[2] };
                            //globalData.arrDTDataReading.push(c6Obj);
                            await this.validateTwoSaTime(countSix, productObj, JARTypeobj, IdsNo);
                            if (c6Obj.A != undefined && c6Obj.B != undefined) {
                                tempDTObj.arr_reading.push(c6Obj);
                            }
                            sample_recived = true;
                        }
                    }

                    var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                    if (obJARTypeDT == undefined) {
                        globalData.arrJARTypeDT.push({
                            idsNo: IdsNo,
                            JarType: "A",
                            sapoflg: false,

                        })
                    } else {
                        obJARTypeDT.idsNo = IdsNo;
                        obJARTypeDT.JarType = obJARTypeDT.JarType;
                        obJARTypeDT.sapoflg = false

                    }

                    if (sample_recived) {
                        var JARA = [], JARB = [];
                        //var selected_jar = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);

                        for (let i = 0; i < tempDTObj.arr_reading.length; i++) {
                            JARA.push(tempDTObj.arr_reading[i].A);
                            JARB.push(tempDTObj.arr_reading[i].B);
                        }
                        if (JARA[0].match(/\d+/g) && JARB[0].match(/\d+/g)) {
                            tempDTObj.rotaryType = "Double";
                        }
                        else {

                            tempDTObj.rotaryType = "Single";
                        }

                        if (tempDTObj.rotaryType != productObj.Sys_RotaryType) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }


                        for (let i = 0; i < tempDTObj.arr_reading.length; i++) {

                            if (JARA[i].match(/\d+/g)) {
                                obJARTypeDT.JarType = "A"
                            }
                            else if (JARB[i].match(/\d+/g)) {
                                obJARTypeDT.JarType = "B"
                            }
                        }


                    }

                    if (globalData.arrTDTData[0].ediflg == true && obJARTypeDT.JarType != undefined) {

                        if (productObj.Sys_RotaryType == 'Single') {
                            //tempTDObj.srtTempData = actualProtocol
                            if (obJARTypeDT.JarType == 'A') {
                                var temp = globalData.arrTDTData[0].strsettemp.split('|')[1].trim();
                                globalData.arrTDTData = []
                            }
                            else {
                                var temp = globalData.arrTDTData[0].strsettemp.split('|')[2].trim();
                                globalData.arrTDTData = []
                            }
                            tempDTObj.Bath_Temp = temp;
                        }
                        else {
                            tempDTObj.Bath_Temp = globalData.arrTDTData[0].strsettemp.split('|')[1].trim();
                            tempDTObj.bsetdata = globalData.arrTDTData[0].strsettemp.split('|')[2].trim();
                            globalData.arrTDTData = []

                        }
                    }




                    var haltDur = actualProtocol.includes("HALT DUR.");
                    if (haltDur == true) {
                        var jar = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                        var haltDuration = actualProtocol;
                        //console.log(haltDuration);
                        if (productObj.Sys_RotaryType == 'Single') {
                            let index = jar.JarType == 'A' ? 1 : 2;

                            if (!moment(haltDuration.split("|")[index].trim(), TimeFormat, true).isValid()

                            ) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = `JAR ${obJARTypeDT.JarType} HALT DURATION,IS NOT VALID`;
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                        }
                        else {
                            if (!moment(haltDuration.split("|")[1].trim(), TimeFormat, true).isValid() &&


                                objInvalid.DT.invalid == false) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A HALT DURATION,IS NOT VALID";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                            if (!moment(haltDuration.split("|")[2].trim(), TimeFormat, true).isValid()
                                &&
                                objInvalid.DT.invalid == false) {

                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B HALT DURATION,IS NOT VALID";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }
                        }

                        var hdObj = { "A_hd": haltDuration.split("|")[1], "B_hd": haltDuration.split("|")[2] };
                        //globalData.arrDTData.push(hdObj);
                        tempDTObj.arr_heading.push(hdObj);
                    }


                    if (actualProtocol.includes("BATH")) {
                        globalData.arrJARTypeDT.sapoflg = true
                    }
                    var tempMin = actualProtocol.includes("TEMP. MIN.");
                    if (tempMin == true) {

                        var tempMinimum = actualProtocol;
                        var tempMinVal = tempMinimum.split(":")[1];
                        //var tempMinVal1 = tempMinVal.replace(/\s+/g, "|");
                        var tempMinVal1 = tempMinVal.replace(/[\sNR]+/g, "|");
                        // var bathtemp = actualProtocol.charAt(BathIndex);
                        // var Atemp = actualProtocol.charAt(Apointer);
                        // var Btemp = actualProtocol.charAt(Bpointer);

                        if (globalData.arrJARTypeDT.sapoflg == true) {

                            if (productObj.Sys_RotaryType == 'Single') {


                                if (obJARTypeDT.JarType == 'A') {
                                    var A_tempMin = tempMinVal1.split("|")[2] == '--' ? tempMinVal1.split("|")[3] : tempMinVal1.split("|")[2]
                                    var B_tempMin = 0
                                    var tempMinObj = { "A_tempMin": A_tempMin, "B_tempMin": B_tempMin };
                                    if (isNaN(A_tempMin) || A_tempMin.length === 0) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                                else {
                                    var A_tempMin = 0
                                    var B_tempMin = tempMinVal1.split("|")[2] == '--' ? tempMinVal1.split("|")[3] : tempMinVal1.split("|")[2]
                                    var tempMinObj = { "A_tempMin": A_tempMin, "B_tempMin": B_tempMin };
                                    if (isNaN(B_tempMin) || B_tempMin.length === 0) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                            }
                            else {
                                var A_tempMin = tempMinVal1.split("|")[2] == '--' ? 0 : tempMinVal1.split("|")[2]
                                var B_tempMin = tempMinVal1.split("|")[3] == '--' ? 0 : tempMinVal1.split("|")[3]
                                var tempMinObj = { "A_tempMin": A_tempMin, "B_tempMin": B_tempMin };

                                if (isNaN(A_tempMin) || isNaN(B_tempMin) || A_tempMin.length === 0 || B_tempMin.length === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }

                        }
                        else {

                            var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                            var A_Min = tempMinVal1.split("|")[1] == '--' ? 0 : tempMinVal1.split("|")[1]
                            var B_Min = tempMinVal1.split("|")[2] == '--' ? 0 : tempMinVal1.split("|")[2]
                            var tempMinObj = { "A_tempMin": A_Min, "B_tempMin": B_Min };
                            if (productObj.Sys_RotaryType == 'Single' && (A_Min != 0 && B_Min != 0)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                            if (productObj.Sys_RotaryType == 'Single' && obJARTypeDT.JarType === 'A') {
                                if (isNaN(A_Min) || A_Min === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            } else if (productObj.Sys_RotaryType == 'Single' && obJARTypeDT.JarType === 'B') {
                                if (isNaN(B_Min) || B_Min === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            } else if (productObj.Sys_RotaryType == 'Double') {
                                if (isNaN(A_Min) || A_Min === 0 || isNaN(B_Min) || B_Min === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }

                        }





                        if (tempMinVal1.split("|").length == 5) {
                            var A_Min = tempMinVal1.split("|")[2] == '--' ? 0 : tempMinVal1.split("|")[2]
                            var B_Min = tempMinVal1.split("|")[3] == '--' ? 0 : tempMinVal1.split("|")[3]
                            if (productObj.Sys_RotaryType == 'Single' && (A_Min != 0 && B_Min != 0)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                        }



                        //== '--' ? 0 : newDTData[3].A_tempMin
                        //globalData.arrDTData.push(tempMinObj);
                        tempDTObj.arr_heading.push(tempMinObj);
                    }

                    var tempMax = actualProtocol.includes("TEMP. MAX.");
                    if (tempMax == true) {
                        var tempMaximum = actualProtocol;
                        var tempMaxVal = tempMaximum.split(":")[1];
                        //var tempMaxVal1 = tempMaxVal.replace(/\s+/g, "|");
                        var tempMaxVal1 = tempMaxVal.replace(/[\sNR]+/g, "|");
                        if (globalData.arrJARTypeDT.sapoflg == true) {
                            if (productObj.Sys_RotaryType == 'Single') {
                                if (obJARTypeDT.JarType == 'A') {
                                    var A_tempMax = tempMaxVal1.split("|")[2] == '--' ? tempMaxVal1.split("|")[3] : tempMaxVal1.split("|")[2]
                                    var B_tempMax = 0
                                    var tempMaxObj = { "A_tempMax": A_tempMax, "B_tempMax": B_tempMax };
                                    if (isNaN(A_tempMax) || A_tempMax.length === 0) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                                else {
                                    var A_tempMax = 0
                                    var B_tempMax = tempMaxVal1.split("|")[2] == '--' ? tempMaxVal1.split("|")[3] : tempMaxVal1.split("|")[2]
                                    var tempMaxObj = { "A_tempMax": A_tempMax, "B_tempMax": B_tempMax };
                                    if (isNaN(B_tempMax) || B_tempMax.length === 0) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                            }
                            else {
                                var A_tempMax = tempMaxVal1.split("|")[2]
                                var B_tempMax = tempMaxVal1.split("|")[3]
                                var tempMaxObj = { "A_tempMax": A_tempMax, "B_tempMax": B_tempMax };
                                if (isNaN(A_tempMax) || isNaN(B_tempMax) || A_tempMax.length === 0 || B_tempMax.length === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }

                        }
                        else {
                            var A_tempMax = tempMaxVal1.split("|")[1] == '--' ? 0 : tempMaxVal1.split("|")[1];
                            var B_tempMax = tempMaxVal1.split("|")[2] == '--' ? 0 : tempMaxVal1.split("|")[2];
                            var tempMaxObj = { "A_tempMax": A_tempMax, "B_tempMax": B_tempMax };
                            var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                            // globalData.arrDTData.push(tempMaxObj);

                            if (productObj.Sys_RotaryType == 'Single' && obJARTypeDT.JarType === 'A') {
                                if (isNaN(A_tempMax) || A_tempMax === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            } else if (productObj.Sys_RotaryType == 'Single' && obJARTypeDT.JarType === 'B') {
                                if (isNaN(B_tempMax) || B_tempMax === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            } else if (productObj.Sys_RotaryType == 'Double') {
                                if (isNaN(A_tempMax) || A_tempMax === 0 || isNaN(B_tempMax) || B_tempMax === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }

                        }
                        tempDTObj.arr_heading.push(tempMaxObj);
                    }

                    var sign = actualProtocol.includes("SIGNATURE");
                    var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
                    if (sign == true && !objInvalid.DT.invalid) {
                        let tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                        var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                        //let tempmin = tempDTObj.arr_heading.filter(obj => obj.A_tempMin);


                        let A_MAX = tempDTObj.arr_heading.filter(obj => obj.A_tempMax);
                        let B_MAX = tempDTObj.arr_heading.filter(obj => obj.B_tempMax);

                        let A_MIN = tempDTObj.arr_heading.filter(obj => obj.A_tempMin);
                        let B_MIN = tempDTObj.arr_heading.filter(obj => obj.B_tempMin);

                        let tempmax = A_MAX.length == 0 ? B_MAX : A_MAX;
                        let tempmin = A_MIN.length == 0 ? B_MIN : A_MIN;

                        let productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                        if (productObj.Sys_RotaryType == 'Single') {
                            if (obJARTypeDT.JarType == 'A') {
                                let A_tempMin = tempmin[0].A_tempMin
                                let A_tempMax = tempmax[0].A_tempMax
                                if (parseFloat(A_tempMin) > parseFloat(A_tempMax)) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = `JAR A Temp min > JAR A Temp max`;
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }

                            }
                            else {
                                let B_tempMin = tempmin[0].B_tempMin
                                let B_tempMax = tempmax[0].B_tempMax
                                if (parseFloat(B_tempMin) > parseFloat(B_tempMax)) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = `JAR B Temp min > JAR B Temp max`;
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }

                        }
                        else {
                            let B_tempMin = tempmin[0].B_tempMin
                            let B_tempMax = tempmax[0].B_tempMax
                            let A_tempMin = tempmin[0].A_tempMin
                            let A_tempMax = tempmax[0].A_tempMax

                            if (parseFloat(A_tempMin) > parseFloat(A_tempMax) || parseFloat(B_tempMin) > parseFloat(B_tempMax)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = `JAR A or B Temp min > JAR A or B Temp max`;
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }


                        }


                        var signature = actualProtocol;
                        //globalData.arrDTData.push(signature);
                        bulkDataFlag.flgDTFlag = false;

                    }
                }


                return tdValue;
            }
            else {
                /**
                * @description We are here setting TD000 and HD000 to true
                */
                globalData.arrTDTData = []
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                globalData.arrJARTypeDT.sapoflg = false
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                console.log(tempTDHD)
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
                    //let tempDTData = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                    var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);

                    if ((objInvalid != undefined && objInvalid.DT.invalid == true) || tempTDObj.arr_heading.length != 5) {
                        /**
                         * @description HERE WE MUST EMPTY `arr_heading` AND `arr_reading` after invalid data
                         * because array may contain invalid data
                         */


                        if (tempTDObj == undefined) {
                            globalData.arrDTData.push({
                                idsNo: IdsNo, arr_heading: [], arr_reading: [], arr_info: [],
                                rotaryType: undefined,
                                mode: undefined,
                                Bath_Temp: undefined,
                                bsetdata: undefined,


                            })
                        } else {
                            tempTDObj.arr_heading = [];
                            tempTDObj.arr_reading = [];
                            tempTDObj.arr_info = [];
                            tempTDObj.rotaryType = undefined;
                            tempTDObj.mode = undefined;
                            tempTDObj.Bath_Temp = undefined;
                            tempTDObj.bsetdata = undefined;


                        }
                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'DT', flag: 'ABORTED' } });
                        objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', '', 'ended');
                        return `${protocolIncomingType}R40Invalid String,,,,`
                        //return `${protocolIncomingType}R40INVALID DATA,RECEIVED,RETRANSMIT DATA,,`

                    }
                    else {

                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'DT', flag: 'COMPLETED' } });
                        let now = new Date();
                        let tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                        var productlimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
                        console.log(tempDTObj);
                        var newDTData = tempDTObj.arr_heading;
                        var newArrayReading = tempDTObj.arr_reading;
                        var newArrayInfo = tempDTObj.arr_info;
                        var startDate = newArrayInfo[0].A_startDate;
                        startDate = startDate.split("/").reverse().join("-");
                        //var newArrayReading = newDTReading.slice(0, -1);//to remove undefine from array
                        var checkType = protocol.split(',');
                        var responseType = checkType[3].split("");
                        var actualResponseType = responseType[0];
                        var jarA = [], jarB = [];


                        if (newDTData.length != 0) {

                            for (let i = 0; i < newArrayReading.length; i++) {
                                jarA.push(newArrayReading[i].A);
                                jarB.push(newArrayReading[i].B);
                            }

                            var jarType;
                            var timeStatus; // 
                            var endDate;
                            var startTime;
                            var endTime;
                            // == 
                            if (productObj.Sys_RotaryType == 'Single') {
                                var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                                if (objJARTypeDT.JarType == "A") {
                                    jarType = "A";
                                    //Added on 05/09/2020 taking date and time from string for A
                                    startTime = newDTData[0].A_st;
                                    endTime = newDTData[1].A_et;
                                    var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                    var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                    endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                                }
                                else {
                                    jarType = "B";
                                    //Added on 05/09/2020 taking date and time from string for B
                                    startTime = newDTData[0].B_st;
                                    endTime = newDTData[1].B_et;
                                    var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                    var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                    endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                                }
                            } else {
                                //Added on 05/09/2020 taking date and time from string for A (Double Rotory)
                                startTime = newDTData[0].A_st;
                                endTime = newDTData[1].A_et;
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                            }

                            var le, actualRunTime, completeTable, detailTable;
                            if (ProductType.productType == 2 && (productObj.Sys_Area == 'Pallet Coating' || productObj.Sys_Area == 'Coating')) {
                                productObj.Sys_Area = 'Capsule Filling';
                                var res = await objProduct.productData(productObj);
                                productObj.Sys_Area = 'Pallet Coating';
                            } else {
                                var res = await objProduct.productData(productObj);
                            }

                            actualRunTime = ProductType.productType == 1 ? res[1].Param13_Nom : res[1].Param6_Nom;
                            completeTable = ProductType.productType == 1 ? 'tbl_tab_master13' : 'tbl_cap_master6';
                            detailTable = ProductType.productType == 1 ? 'tbl_tab_detail13' : 'tbl_cap_detail6';
                            var DTJAR = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                            //var jartype = `jar${objJARTypeDT.JarType}`;
                            var masterCompleteData = {
                                str_tableName: completeTable,
                                data: [
                                    { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                    { str_colName: 'InstruId', value: 1 },
                                    { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                    { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                    { str_colName: 'ProductType', value: ProductType.productType },
                                    // { str_colName: 'Qty', value: productlimits.DT.noOfSamples },
                                    { str_colName: 'Qty', value: 6 },
                                    { str_colName: 'Idsno', value: IdsNo },
                                    { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                    { str_colName: 'BalanceId', value: currentCubicleObj.Sys_BalID },
                                    { str_colName: 'VernierId', value: currentCubicleObj.Sys_VernierID },
                                    { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                    { str_colName: 'UserId', value: tempUserObject.UserId },
                                    { str_colName: 'UserName', value: tempUserObject.UserName },
                                    { str_colName: 'PrDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : startDate },
                                    { str_colName: 'PrTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : startTime },
                                    { str_colName: 'PrEndDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : endDate },
                                    { str_colName: 'PrEndTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : endTime },
                                    { str_colName: 'Side', value: productObj.Sys_RotaryType == 'Single' ? (jarType == "A") ? "NA" : "NA" : "LHS" },
                                    { str_colName: 'WgmtModeNo', value: 13 },
                                    { str_colName: 'Nom', value: ProductType.productType == 1 ? res[1].Param13_Nom : res[1].Param6_Nom },
                                    { str_colName: 'T1NegTol', value: ProductType.productType == 1 ? res[1].Param13_T1Neg : res[1].Param6_T1Neg },
                                    { str_colName: 'T1PosTol', value: ProductType.productType == 1 ? res[1].Param13_T1Pos : res[1].Param6_T1Pos },
                                    { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                    { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                    { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                    { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                    { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                    { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                    { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                    { str_colName: 'RepoLabel11', value: currentCubicleObj.Sys_Validation },
                                    { str_colName: 'PrintNo', value: 0 },
                                    { str_colName: 'IsArchived', value: 0 },
                                    { str_colName: 'GraphType', value: 0 },
                                    { str_colName: 'BatchComplete', value: 0 },
                                    { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                    { str_colName: 'Version', value: productObj.Sys_Version },
                                    { str_colName: 'DTID', value: currentCubicleObj.Sys_DTID },
                                    { str_colName: 'Media', value: productObj.Sys_media },
                                    { str_colName: 'Lot', value: objLotData.LotNo },
                                    { str_colName: 'Area', value: productObj.Sys_Area },
                                    { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                    { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                    { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                    { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                    { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                                    { str_colName: 'DT_Mode', value: tempDTObj.mode == undefined ? 'Registration' : tempDTObj.mode },
                                    { str_colName: 'DT_BasketType', value: tempDTObj.basketType },
                                    { str_colName: 'DT_Jar', value: DTJAR.JarType },
                                    { str_colName: 'DT_SetTemp', value: tempDTObj.Bath_Temp },
                                ]
                            }

                            if (jarType == "A") {
                                masterCompleteData.data.push(

                                    { str_colName: 'MinTemp', value: newDTData[3].A_tempMin },
                                    { str_colName: 'MaxTemp', value: newDTData[4].A_tempMax },

                                );
                            }
                            else if (jarType == "B") {
                                masterCompleteData.data.push(

                                    { str_colName: 'MinTemp', value: newDTData[3].B_tempMin },
                                    { str_colName: 'MaxTemp', value: newDTData[4].B_tempMax },

                                );
                            }
                            else {
                                masterCompleteData.data.push(

                                    { str_colName: 'MinTemp', value: newDTData[3].A_tempMin },
                                    { str_colName: 'MaxTemp', value: newDTData[4].A_tempMax },

                                );
                            }
                            //console.log(masterCompleteData);
                            var resultCompleteData = await database.save(masterCompleteData);
                            var lastInsertedID = resultCompleteData[0].insertId;

                            if (jarType == "A") {
                                var startTime = newDTData[0].A_st.trim();
                                var endTime = newDTData[1].A_et.trim();
                                var startTimeval = moment(startTime, 'HH:mm:ss');
                                var endTimeval = moment(endTime, 'HH:mm:ss');
                                var runTime = moment.utc(moment(endTimeval, "HH:mm:ss")
                                    .diff(moment(startTimeval, "HH:mm:ss"))).format("HH:mm:ss")
                                var hDur = newDTData[2].A_hd.trim();

                                for (const [i, dtVal] of jarA.entries()) {

                                    var endTmSS = moment(startTime, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObj = {
                                        str_tableName: detailTable,
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedID },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: "NA" },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            // { str_colName: 'DT_Temp', value: 0 },
                                            { str_colName: 'DT_Temp', value: newDTData[4].A_tempMax },//as discussed with sheetal and shraddhanad for hosure
                                            { str_colName: 'DT_StartTm', value: startTime },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            // { str_colName: 'DT_RunTime', value: runTime },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDur }
                                        ]
                                    }
                                    //console.log(insertDetailObj);
                                    var jarARes = await database.save(insertDetailObj);
                                }


                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;


                                var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {
                                    var returnBatchRes = await objBatchSummary.saveBatchSummaryDT(lastInsertedID, 0, productObj, IdsNo);
                                }
                                var objUpdateValidation = {
                                    str_tableName: "tbl_cubical",
                                    data: [
                                        { str_colName: 'Sys_Validation', value: 0 },
                                    ],
                                    condition: [
                                        { str_colName: 'Sys_IDSNo', value: IdsNo },
                                    ]
                                }
                                await database.update(objUpdateValidation);
                                // //Online printing code of Jar B 
                                // const objIOnlinePrint = new IOnlinePrint();
                                // objIOnlinePrint.RepSerNo = lastInsertedID;
                                // objIOnlinePrint.reportOption = "Disintegration Tester";
                                // objIOnlinePrint.testType = "Regular";
                                // objIOnlinePrint.userId = tempUserObject.UserId;
                                // objIOnlinePrint.username = tempUserObject.UserName;
                                // objIOnlinePrint.idsNo = IdsNo
                                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

                                // await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
                                le = `${protocolIncomingType}` + `R1`;
                                var tempFlagAJar = false; // For time
                                var tempFlagTemp = false // for Tempreture
                                for (const [i, dtVal] of jarA.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        // return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }
                                if ((parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].A_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].A_tempMax))) {
                                    tempFlagTemp = true;
                                }
                                if (tempFlagTemp == true || tempFlagAJar == true) {
                                    le = `${protocolIncomingType}` + `R2`;
                                }
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'DT Weighment Completed on IDS' + IdsNo });
                                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                                objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', 'DT', 'completed');
                                //empty object when data is completly saved 
                                var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                                if (tempTDObj == undefined) {
                                    globalData.arrDTData.push({
                                        idsNo: IdsNo, arr_heading: [], arr_reading: [], arr_info: [],
                                        rotaryType: undefined,
                                        mode: undefined,
                                        basketType: undefined,
                                        Bath_Temp: undefined

                                    })
                                } else {
                                    tempTDObj.arr_heading = [];
                                    tempTDObj.arr_reading = [];
                                    tempTDObj.arr_info = [];
                                    tempTDObj.rotaryType = undefined;
                                    tempTDObj.mode = undefined;
                                    tempTDObj.basketType = undefined;
                                    tempTDObj.Bath_Temp = undefined;

                                }
                                return le;

                            }
                            else if (jarType == "B") {
                                var startTime = newDTData[0].B_st.trim();
                                var endTime = newDTData[1].B_et.trim();
                                var startTimeval = moment(startTime, 'HH:mm:ss');
                                var endTimeval = moment(endTime, 'HH:mm:ss');
                                var runTime = moment.utc(moment(endTimeval, "HH:mm:ss")
                                    .diff(moment(startTimeval, "HH:mm:ss"))).format("HH:mm:ss")
                                var hDur = newDTData[2].B_hd.trim();

                                for (const [i, dtVal] of jarB.entries()) {

                                    var endTmSS = moment(startTime, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObj = {
                                        str_tableName: detailTable,
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedID },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: jarType == "NA" },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            { str_colName: 'DT_Temp', value: newDTData[4].B_tempMax },
                                            { str_colName: 'DT_StartTm', value: startTime },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDur }
                                        ]
                                    }

                                    var jarBRes = await database.save(insertDetailObj);


                                }

                                var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {
                                    var returnBatchRes = await objBatchSummary.saveBatchSummaryDT(lastInsertedID, 0, productObj, IdsNo);
                                }
                                var objUpdateValidation = {
                                    str_tableName: "tbl_cubical",
                                    data: [
                                        { str_colName: 'Sys_Validation', value: 0 },
                                    ],
                                    condition: [
                                        { str_colName: 'Sys_IDSNo', value: IdsNo },
                                    ]
                                }
                                await database.update(objUpdateValidation);
                                //Online printing code of Jar B 
                                // const objIOnlinePrint = new IOnlinePrint();
                                // objIOnlinePrint.RepSerNo = lastInsertedID;
                                // objIOnlinePrint.reportOption = "Disintegration Tester";
                                // objIOnlinePrint.testType = "Regular";
                                // objIOnlinePrint.userId = tempUserObject.UserId;
                                // objIOnlinePrint.username = tempUserObject.UserName;
                                // objIOnlinePrint.idsNo = IdsNo
                                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

                                // await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'DT Weighment Completed on IDS' + IdsNo });
                                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                                objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', 'DT', 'completed');
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;


                                le = `${protocolIncomingType}` + `R1`;
                                var tempFlagAJar = false; // For time
                                var tempFlagTemp = false // for Tempreture
                                for (const [i, dtVal] of jarB.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        //return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }
                                if ((parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].B_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].B_tempMax))) {
                                    tempFlagTemp = true;
                                }
                                if (tempFlagTemp == true || tempFlagAJar == true) {
                                    le = `${protocolIncomingType}` + `R2`;
                                }
                                //empty object when data is completly saved 
                                var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                                if (tempTDObj == undefined) {
                                    globalData.arrDTData.push({
                                        idsNo: IdsNo, arr_heading: [], arr_reading: [], arr_info: [],
                                        rotaryType: undefined,
                                        mode: undefined,
                                        basketType: undefined,
                                        Bath_Temp: undefined



                                    })
                                } else {
                                    tempTDObj.arr_heading = [];
                                    tempTDObj.arr_reading = [];
                                    tempTDObj.arr_info = [];
                                    tempDTObj.rotaryType = undefined;
                                    tempDTObj.mode = undefined;
                                    tempTDObj.basketType = undefined;
                                    tempTDObj.Bath_Temp = undefined;

                                }
                                return le;

                            }
                            else {

                                // var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                                // if (objJARTypeDT.JarType == "A") {
                                //     jarType = "A";
                                // }
                                // else {
                                //     jarType = "B";
                                // }

                                var startTimeA = newDTData[0].A_st.trim();
                                var endTimeA = newDTData[1].A_et.trim();
                                var startTimevalA = moment(startTimeA, 'HH:mm:ss');
                                var endTimevalA = moment(endTimeA, 'HH:mm:ss');
                                var runTimeA = moment.utc(moment(endTimevalA, "HH:mm:ss")
                                    .diff(moment(startTimevalA, "HH:mm:ss"))).format("HH:mm:ss")
                                var hDurA = newDTData[2].A_hd.trim();

                                var startTimeB = newDTData[0].B_st.trim();
                                var endTimeB = newDTData[1].B_et.trim();
                                var startTimevalB = moment(startTimeB, 'HH:mm:ss');
                                var endTimevalB = moment(endTimeB, 'HH:mm:ss');
                                var runTimeB = moment.utc(moment(endTimevalB, "HH:mm:ss")
                                    .diff(moment(startTimevalB, "HH:mm:ss"))).format("HH:mm:ss");
                                var hDurB = newDTData[2].B_hd.trim();



                                for (const [i, dtVal] of jarA.entries()) {
                                    var endTmSS = moment(startTimeA, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObjA = {
                                        str_tableName: detailTable,
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedID },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: 'LHS' },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            { str_colName: 'DT_Temp', value: newDTData[4].A_tempMax },
                                            { str_colName: 'DT_StartTm', value: startTimeA },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            //{ str_colName: 'DT_RunTime', value: runTimeA },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDurA }
                                        ]
                                    }
                                    var ResJarA = await database.save(insertDetailObjA);

                                }
                                //Online printing code of Jar A 
                                // const objIOnlinePrintA = new IOnlinePrint();
                                // objIOnlinePrintA.RepSerNo = lastInsertedID;
                                // objIOnlinePrintA.reportOption = "Disintegration Tester";
                                // objIOnlinePrintA.testType = "Regular";
                                // objIOnlinePrintA.userId = tempUserObject.UserId;
                                // objIOnlinePrintA.username = tempUserObject.UserName;
                                // objIOnlinePrintA.idsNo = IdsNo
                                // const objPrinterNameA = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                // const a = await objPrintReport.generateOnlineReportAsync(objIOnlinePrintA, objPrinterNameA.Sys_PrinterName)
                                startTime = newDTData[0].B_st;
                                endTime = newDTData[1].B_et;
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                                var JARDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                                var templimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
                                /* inserting Data of double rotatry for B*/
                                var masterCompleteDataJarB = {
                                    str_tableName: completeTable,
                                    data: [
                                        { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                        { str_colName: 'InstruId', value: 1 },
                                        { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                        { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                        { str_colName: 'ProductType', value: ProductType.productType },
                                        // { str_colName: 'Qty', value: templimits.DT.noOfSamples },
                                        { str_colName: 'Qty', value: 6 },
                                        { str_colName: 'Idsno', value: IdsNo },
                                        { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                        { str_colName: 'BalanceId', value: currentCubicleObj.Sys_BalID },
                                        { str_colName: 'VernierId', value: currentCubicleObj.Sys_VernierID },
                                        { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                        { str_colName: 'UserId', value: tempUserObject.UserId },
                                        { str_colName: 'UserName', value: tempUserObject.UserName },
                                        { str_colName: 'PrDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : startDate },
                                        { str_colName: 'PrTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : startTime },
                                        { str_colName: 'PrEndDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : endDate },
                                        { str_colName: 'PrEndTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : endTime },
                                        { str_colName: 'Side', value: 'RHS' },
                                        { str_colName: 'Lot', value: objLotData.LotNo },
                                        { str_colName: 'WgmtModeNo', value: 13 },
                                        { str_colName: 'Nom', value: ProductType.productType == 1 ? res[1].Param13_Nom : res[1].Param6_Nom },
                                        { str_colName: 'T1NegTol', value: ProductType.productType == 1 ? res[1].Param13_T1Neg : res[1].Param6_T1Neg },
                                        { str_colName: 'T1PosTol', value: ProductType.productType == 1 ? res[1].Param13_T1Pos : res[1].Param6_T1Pos },
                                        { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                        { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                        { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                        { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                        { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                        { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                        { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                        { str_colName: 'RepoLabel11', value: currentCubicleObj.Sys_Validation },
                                        { str_colName: 'PrintNo', value: 0 },
                                        { str_colName: 'IsArchived', value: 0 },
                                        { str_colName: 'GraphType', value: 0 },
                                        { str_colName: 'BatchComplete', value: 0 },
                                        { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                        { str_colName: 'Version', value: productObj.Sys_Version },
                                        { str_colName: 'MinTemp', value: newDTData[3].B_tempMin },
                                        { str_colName: 'MaxTemp', value: newDTData[4].B_tempMax },
                                        { str_colName: 'DTID', value: currentCubicleObj.Sys_DTID },
                                        { str_colName: 'Media', value: productObj.Sys_media },
                                        { str_colName: 'Area', value: productObj.Sys_Area },
                                        { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                        { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                        { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                        { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                        { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                                        { str_colName: 'DT_Mode', value: tempDTObj.mode == undefined ? 'Registration' : tempDTObj.mode },
                                        { str_colName: 'DT_BasketType', value: tempDTObj.basketType },
                                        { str_colName: 'DT_Jar', value: "B" },
                                        { str_colName: 'DT_SetTemp', value: tempDTObj.bsetdata },
                                    ]
                                }
                                var resultCompleteDataJarB = await database.save(masterCompleteDataJarB);

                                var lastInsertedIDJarB = resultCompleteDataJarB[0].insertId;
                                for (const [i, dtVal] of jarB.entries()) {
                                    var endTmSS = moment(startTimeB, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObjB = {
                                        str_tableName: detailTable,
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedIDJarB },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: 'RHS' },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            { str_colName: 'DT_Temp', value: newDTData[4].B_tempMax },
                                            { str_colName: 'DT_StartTm', value: startTimeB },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            //{ str_colName: 'DT_RunTime', value: runTimeB },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDurB }
                                        ]
                                    }

                                    var ResDetailB = await database.save(insertDetailObjB);

                                }
                                /* end of  inserting Data of double rotatry for B*/



                                var objUpdateValidation = {
                                    str_tableName: "tbl_cubical",
                                    data: [
                                        { str_colName: 'Sys_Validation', value: 0 },
                                    ],
                                    condition: [
                                        { str_colName: 'Sys_IDSNo', value: IdsNo },
                                    ]
                                }


                                var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {
                                    var returnBatchRes = await objBatchSummary.saveBatchSummaryDT(lastInsertedID, lastInsertedIDJarB, productObj, IdsNo);
                                }

                                var resValidation = await database.update(objUpdateValidation);
                                // Activity Log for DT weighmnet Completed
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'DT Weighment Completed on IDS' + IdsNo });
                                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                                // Instrument usage for DT complete
                                objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', '', 'completed')




                                //Online printing code of Jar B 


                                //   if (a == true) {
                                // const objIOnlinePrintB = new IOnlinePrint();
                                // objIOnlinePrintB.RepSerNo = lastInsertedIDJarB;
                                // objIOnlinePrintB.reportOption = "Disintegration Tester";
                                // objIOnlinePrintB.testType = "Regular";
                                // objIOnlinePrintB.userId = tempUserObject.UserId;
                                // objIOnlinePrintB.username = tempUserObject.UserName;
                                // objIOnlinePrintB.idsNo = IdsNo
                                // const objPrinterNameB = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

                                // const b = await objPrintReport.generateOnlineReportAsync(objIOnlinePrintB, objPrinterNameB.Sys_PrinterName);
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                // if ((parseInt(actualRunTime.replace(regExp, "$1$2$3")) > parseInt(runTimeA.replace(regExp, "$1$2$3")))
                                //     && (parseInt(actualRunTime.replace(regExp, "$1$2$3")) > parseInt(runTimeB.replace(regExp, "$1$2$3")))) {
                                //     return le = `${protocolIncomingType}` + `R1`;
                                // } else {
                                //     return le = `${protocolIncomingType}` + `R2`;
                                // }
                                //  }

                                le = `${protocolIncomingType}` + `R1`

                                var tempFlagAJar = false; // For time
                                var tempFlagTemp = false // for Tempreture
                                for (const [i, dtVal] of jarA.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        // return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }


                                for (const [i, dtVal] of jarB.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        // return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }

                                if ((parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].A_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].B_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].A_tempMax)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].B_tempMax))) {
                                    tempFlagTemp = true;
                                }
                                if (tempFlagTemp == true || tempFlagAJar == true) {
                                    le = `${protocolIncomingType}` + `R2`;
                                }
                                //empty object when data is completly saved 
                                var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                                if (tempTDObj == undefined) {
                                    globalData.arrDTData.push({
                                        idsNo: idsNo, arr_heading: [], arr_reading: [], arr_info: [],
                                        rotaryType: undefined,
                                        mode: undefined,
                                        Bath_Temp: undefined,
                                    })
                                } else {
                                    tempTDObj.arr_heading = [];
                                    tempTDObj.arr_reading = [];
                                    tempTDObj.arr_info = [];
                                    tempDTObj.rotaryType = undefined;
                                    tempDTObj.mode = undefined;
                                    tempDTObj.Bath_Temp = undefined;
                                }
                                return le;


                            }
                            //batch Summary record
                        }


                    }
                } else {
                    console.log('REPEAT_COUNT FOR TDHD000');
                    return '+';
                }

            }// else ends

        } catch (err) {
            var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
            if (tempTDObj == undefined) {
                globalData.arrDTData.push({ idsNo: idsNo, arr_heading: [], arr_reading: [], arr_info: [], rotaryType: undefined, mode: undefined })
            } else {
                tempTDObj.arr_heading = [];
                tempTDObj.arr_reading = [];
                tempTDObj.arr_info = [];
                tempTDObj.rotaryType = undefined;
                tempTDObj.mode = undefined;
                tempTDObj.Bath_Temp = undefined;

            }
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log(err);
        }

    }

    async insertBulkWeighmentDTEDI2SABolus(IdsNo, protocol, DTModel) {
        try {

            var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var currentCubicleObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var selectedIds;
            var ModeType;// dual mode or registration mode
            var ModeType1;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var actualProtocol = protocol;
            var tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var tdValue = actualProtocol.substring(0, 5);
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var objArrLimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
            var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
            var protocolIncomingType = tdValue.substring(0, 1);//Check incoming Protocol is from "T" or "H"

            globalData.arrTDTData.push({
                strsettemp: [],
                ediflg: false
            })


            if (tdValue != "TD000" && tdValue != "HD000" && tdValue != "ED000") {
                /**
                * @description We are here setting TD000 and HD000 to false
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }
                /************************************************************* */

                var bulkDataFlag = globalData.arrBulkDataFlag.find(k => k.IdsNo == IdsNo);
                var tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);

                var sample_recived = false;

                var jarType = "A";

                var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                if (objJARTypeDT != undefined) {
                    if (objJARTypeDT.JarType == "A") {
                        jarType = "A";
                    }
                    else {
                        jarType = "B";
                    }
                }
                var BathTemp = actualProtocol.includes("SET BATH TEMP")


                if (BathTemp == true) {

                    var temp = actualProtocol.split(':')[2].trim();
                    temp = temp.replace(/[\sNRrn]+/g, "|");
                    temp = temp.split("|")[0];
                    tempDTObj.Bath_Temp = temp;
                    if (productObj.Sys_RotaryType == "Double") {
                        tempDTObj.bsetdata = temp
                    }
                }

                if (actualProtocol.includes("SET TEMP") && (actualProtocol.includes("BATH") == false)) {
                    globalData.arrTDTData[0].ediflg = true

                    globalData.arrTDTData[0].strsettemp = actualProtocol


                }

                var Model = (actualProtocol.includes("MODEL") || actualProtocol.includes("Model No"));
                if (Model == true) {
                    var prepend = 'Electrolab ';
                    const objBulkInvalid = new bulkInvalid();
                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                    objBulkInvalid.invalidObj.DT.invalid = false;
                    objBulkInvalid.invalidObj.DT.invalidMsg = "";
                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                    var model_name = actualProtocol.split(':')[1].trim();
                    var strModel_name = model_name.split(' ')[0].toString();
                    var Model = prepend.concat(strModel_name);


                    if (Model.includes('ED3PO')) {

                        // const objBulkInvalid = new bulkInvalid();
                        // objBulkInvalid.invalidObj.idsNo = IdsNo;
                        // objBulkInvalid.invalidObj.DT.invalid = true;
                        // objBulkInvalid.invalidObj.DT.invalidMsg = `DATA RECEIVED from ${{ strModel_name }} INSTED OF  ${{ DTModel }}`;
                        // Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'DT', flag: 'ABORTED' } });
                        return `${protocolIncomingType}R40Invalid String,,,,`
                    }


                }

                var testSummaryVal = actualProtocol.includes("Start Date");
                if (testSummaryVal == true) {
                    let tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                    bulkDataFlag.flgDTFlag = true;
                    // Activity Log for DT weighmnet started
                    var objActivity = {};
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'DT Weighment Started on IDS' + IdsNo });
                    objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                    // Instrument usage for DT start
                    objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', 'DT', 'started');
                    // Added on 04-09-2020 to support date complication by pradip
                    var str_startDate = actualProtocol.split('Date:')[1].includes('N') == true ? actualProtocol.split('Date:')[1].split('N') : actualProtocol.split('Date:')[1].split('R')[0].trim();
                    str_startDate = str_startDate[0].trim();
                    var stDateObj = { "A_startDate": str_startDate, "B_startDate": str_startDate };
                    //globalData.arrDTData.push(stObj);
                    tempDTObj.arr_info.push(stDateObj);
                    // const objBulkInvalid = new bulkInvalid();
                    // objBulkInvalid.invalidObj.idsNo = IdsNo;
                    // objBulkInvalid.invalidObj.DT.invalid = false;
                    // objBulkInvalid.invalidObj.DT.invalidMsg = "";
                    // Object.assign(objInvalid, objBulkInvalid.invalidObj);
                }
                if (bulkDataFlag.flgDTFlag == true) {

                    var testStartTime = actualProtocol.includes("START TIME");
                    if (testStartTime == true) {
                        var startTime = actualProtocol;
                        if (actualProtocol.split("|")[1].trim())
                            var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);


                        var jartypeST = actualProtocol.split("|")[1].trim().match(/\d+/g) == null ? obJARTypeDT.JarType = "B" : obJARTypeDT.JarType = "A"


                        if (productObj.Sys_RotaryType == 'Single' && jartypeST == "A") {
                            if (await this.isValidTime(startTime.split("|")[1].trim())) {
                                var stObj = { "A_st": startTime.split("|")[1].trim(), "B_st": startTime.split("|")[1].trim() };
                                tempDTObj.arr_heading.push(stObj);
                            } else {
                                const BulkInvalid = new bulkInvalid();
                                BulkInvalid.invalidObj.idsNo = IdsNo;
                                BulkInvalid.invalidObj.DT.invalid = true;
                                BulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A START TIME,IS NOT VALID";
                                Object.assign(objInvalid, BulkInvalid.invalidObj);
                            }
                        }
                        else if (productObj.Sys_RotaryType == 'Single' && jartypeST == "B") {
                            if (await this.isValidTime(startTime.split("|")[2].trim())) {
                                var stObj = { "A_st": startTime.split("|")[2].trim(), "B_st": startTime.split("|")[2].trim() };

                                tempDTObj.arr_heading.push(stObj);
                            } else {
                                const BulkInvalid = new bulkInvalid();
                                BulkInvalid.invalidObj.idsNo = IdsNo;
                                BulkInvalid.invalidObj.DT.invalid = true;
                                BulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B START TIME,IS NOT VALID";
                                Object.assign(objInvalid, BulkInvalid.invalidObj);
                            }
                        }
                        else {
                            if (await this.isValidTime(startTime.split("|")[1].trim()) && this.isValidTime(startTime.split("|")[2].trim())) {
                                var stObj = { "A_st": startTime.split("|")[1].trim(), "B_st": startTime.split("|")[2].trim() };

                                tempDTObj.arr_heading.push(stObj);
                            } else {
                                const BulkInvalid = new bulkInvalid();
                                BulkInvalid.invalidObj.idsNo = IdsNo;
                                BulkInvalid.invalidObj.DT.invalid = true;
                                BulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B START TIME,IS NOT VALID";
                                Object.assign(objInvalid, BulkInvalid.invalidObj);
                            }
                        }
                    }

                    var testEndTime = actualProtocol.includes("END TIME");
                    if (testEndTime == true) {
                        var endTime = actualProtocol;
                        var JARTypeobj = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                        var jar = actualProtocol.split("|")[1].trim().match(/\d+/g) == null ? JARTypeobj.JarType = "B" : JARTypeobj.JarType = "A"

                        if (productObj.Sys_RotaryType == 'Single' && jar == "A") {

                            if (await this.isValidTime(endTime.split("|")[1].trim())) {
                                var etObj = { "A_et": endTime.split("|")[1].trim(), "B_et": endTime.split("|")[1].trim() };
                                tempDTObj.arr_heading.push(etObj);
                            } else {
                                const BulkInvalid = new bulkInvalid();
                                BulkInvalid.invalidObj.idsNo = IdsNo;
                                BulkInvalid.invalidObj.DT.invalid = true;
                                BulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A END TIME,IS NOT VALID";
                                Object.assign(objInvalid, BulkInvalid.invalidObj);
                            }
                        }
                        else if (productObj.Sys_RotaryType == 'Single' && jar == "B") {

                            if (await this.isValidTime(endTime.split("|")[2].trim())) {
                                var etObj = { "A_et": endTime.split("|")[2].trim(), "B_et": endTime.split("|")[2].trim() };
                                tempDTObj.arr_heading.push(etObj);
                            } else {
                                const BulkInvalid = new bulkInvalid();
                                BulkInvalid.invalidObj.idsNo = IdsNo;
                                BulkInvalid.invalidObj.DT.invalid = true;
                                BulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A END TIME,IS NOT VALID";
                                Object.assign(objInvalid, BulkInvalid.invalidObj);
                            }

                        }
                        else {
                            if (await this.isValidTime(endTime.split("|")[1].trim()) && this.isValidTime(endTime.split("|")[2].trim())) {
                                var etObj = { "A_et": endTime.split("|")[1].trim(), "B_et": endTime.split("|")[2].trim() };
                                tempDTObj.arr_heading.push(etObj);
                            } else {
                                const BulkInvalid = new bulkInvalid();
                                BulkInvalid.invalidObj.idsNo = IdsNo;
                                BulkInvalid.invalidObj.DT.invalid = true;
                                BulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B START TIME,IS NOT VALID";
                                Object.assign(objInvalid, BulkInvalid.invalidObj);
                            }
                        }
                    }


                    var str_mode = actualProtocol.includes("Dual");
                    if (str_mode == true) {
                        ModeType = actualProtocol.split(":")[1].trim();
                        ModeType = ModeType.substring(0, 4);
                        tempDTObj.mode = 'Dual'

                    }

                    var testBasketType = actualProtocol.includes("BASKET TYPE ");

                    if (testBasketType == true) {
                        var basketA = actualProtocol.split("|")[1].trim()
                        var basketB = actualProtocol.split("|")[2].trim()
                        if (basketA.includes('10 Mesh')|| basketA.includes('Bolus')) {
                            tempDTObj.basketType = basketA;
                        } else {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Basket Type Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }

                    }


                    var testDurTime = actualProtocol.includes("TEST ON DUR");
                    if (testDurTime == true) {
                        var durTime = actualProtocol;

                    }

                    if (testDurTime) {
                        if (tempDTObj.mode == 'Dual') {
                            var sample = actualProtocol;
                            var JARTypeobj = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                            if (productObj.Sys_RotaryType == 'Single') {
                                if (JARTypeobj.JarType === 'A') {
                                    if (!await this.isValidTime(sample.split("|")[1].trim())) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                                if (JARTypeobj.JarType === 'B') {
                                    if (!await this.isValidTime(sample.split("|")[2].trim())) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                            }
                            else {
                                if (!await this.isValidTime(sample.split("|")[1].trim()) && await this.isValidTime(sample.split("|")[2].trim())) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }


                            var sample1 = { "A": sample.split("|")[1].trim(), "B": sample.split("|")[2].trim() };
                            //globalData.arrDTDataReading.push(c1Obj);
                            if (sample1.A != undefined && sample1.B != undefined) {
                                tempDTObj.arr_reading.push(sample1);
                            }


                        }
                    }
                    var JARTypeobj = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                    var count1 = actualProtocol.includes("1. ");
                    if (count1 == true) {
                        if (tempDTObj.arr_reading[0] == undefined) {
                            var countOne = actualProtocol;
                            if (countOne.split("|")[1].trim().split(':').length >= 4 || (countOne.split("|")[2].trim().split(':').length >= 4)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            } else {
                                await this.validateTwoSaTime(countOne, productObj, JARTypeobj, IdsNo);
                                var c1Obj = { "A": countOne.split("|")[1], "B": countOne.split("|")[2] };
                                //globalData.arrDTDataReading.push(c1Obj);
                                if (c1Obj.A != undefined && c1Obj.B != undefined) {
                                    tempDTObj.arr_reading.push(c1Obj);
                                }
                            }
                        } else {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }
                    }
                    var count2 = actualProtocol.includes("2. ");
                    if (count2 == true) {
                        if (tempDTObj.arr_reading[1] == undefined && tempDTObj.arr_reading[0] != undefined) {
                            var countTwo = actualProtocol;
                            if (countTwo.split("|")[1].trim().split(':').length >= 4 || (countTwo.split("|")[2].trim().split(':').length >= 4)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                            else {
                                var c2Obj = { "A": countTwo.split("|")[1], "B": countTwo.split("|")[2] };
                                await this.validateTwoSaTime(countTwo, productObj, JARTypeobj, IdsNo);
                                if (c2Obj.A != undefined && c2Obj.B != undefined) {
                                    tempDTObj.arr_reading.push(c2Obj);
                                }
                            }
                        }
                        else {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }
                    }
                    var count3 = actualProtocol.includes("3. ");
                    if (count3 == true) {
                        if (tempDTObj.arr_reading[2] == undefined && tempDTObj.arr_reading[1] != undefined) {
                            var countThree = actualProtocol;
                            if (countThree.split("|")[1].trim().split(':').length >= 4 || (countThree.split("|")[2].trim().split(':').length >= 4)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                            else {
                                var c3Obj = { "A": countThree.split("|")[1], "B": countThree.split("|")[2] };
                                await this.validateTwoSaTime(countThree, productObj, JARTypeobj, IdsNo);
                                if (c3Obj.A != undefined && c3Obj.B != undefined) {
                                    tempDTObj.arr_reading.push(c3Obj);
                                }
                            }
                        } else {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }

                    }
                    var count4 = actualProtocol.includes("4. ");
                    if (count4 == true) {
                        if (tempDTObj.arr_reading[3] == undefined && tempDTObj.arr_reading[2] != undefined) {
                            var countFour = actualProtocol;
                            if (countFour.split("|")[1].trim().split(':').length >= 4 || (countFour.split("|")[2].trim().split(':').length >= 4)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                            else {
                                var c4Obj = { "A": countFour.split("|")[1], "B": countFour.split("|")[2] };
                                //globalData.arrDTDataReading.push(c4Obj);
                                await this.validateTwoSaTime(countFour, productObj, JARTypeobj, IdsNo);
                                if (c4Obj.A != undefined && c4Obj.B != undefined) {
                                    tempDTObj.arr_reading.push(c4Obj);
                                }
                            }
                        } else {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }
                    }
                    var count5 = actualProtocol.includes("5. ");
                    if (count5 == true) {
                        if (tempDTObj.arr_reading[4] == undefined && tempDTObj.arr_reading[3] != undefined) {
                            var countFive = actualProtocol;
                            if (countFive.split("|")[1].trim().split(':').length >= 4 || (countFive.split("|")[2].trim().split(':').length >= 4)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                            else {
                                var c5Obj = { "A": countFive.split("|")[1], "B": countFive.split("|")[2] };
                                //globalData.arrDTDataReading.push(c5Obj);
                                await this.validateTwoSaTime(countFive, productObj, JARTypeobj, IdsNo);
                                if (c5Obj.A != undefined && c5Obj.B != undefined) {
                                    tempDTObj.arr_reading.push(c5Obj);
                                }
                            }
                        } else {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }

                    }
                    var count6 = actualProtocol.includes("6. ");
                    if (count6 == true) {
                        if (tempDTObj.arr_reading[5] == undefined && tempDTObj.arr_reading[4] != undefined) {
                            var countSix = actualProtocol;
                            if (countSix.split("|")[1].trim().split(':').length >= 4 || (countSix.split("|")[2].trim().split(':').length >= 4)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                            else {
                                var c6Obj = { "A": countSix.split("|")[1], "B": countSix.split("|")[2] };
                                //globalData.arrDTDataReading.push(c6Obj);
                                await this.validateTwoSaTime(countSix, productObj, JARTypeobj, IdsNo);
                                if (c6Obj.A != undefined && c6Obj.B != undefined) {
                                    tempDTObj.arr_reading.push(c6Obj);
                                }
                                sample_recived = true;
                            }
                        } else {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Received`;
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }
                    }

                    var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                    if (obJARTypeDT == undefined) {
                        globalData.arrJARTypeDT.push({
                            idsNo: IdsNo,
                            JarType: "A",
                            sapoflg: false,

                        })
                    } else {
                        obJARTypeDT.idsNo = IdsNo;
                        obJARTypeDT.JarType = obJARTypeDT.JarType;
                        obJARTypeDT.sapoflg = false

                    }

                    if (sample_recived) {
                        var JARA = [], JARB = [];
                        //var selected_jar = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);

                        for (let i = 0; i < tempDTObj.arr_reading.length; i++) {
                            JARA.push(tempDTObj.arr_reading[i].A);
                            JARB.push(tempDTObj.arr_reading[i].B);
                        }
                        if (JARA[0].match(/\d+/g) && JARB[0].match(/\d+/g)) {
                            tempDTObj.rotaryType = "Double";
                        }
                        else {

                            tempDTObj.rotaryType = "Single";
                        }

                        if (tempDTObj.rotaryType != productObj.Sys_RotaryType) {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID ROTARY";
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }


                        for (let i = 0; i < tempDTObj.arr_reading.length; i++) {

                            if (JARA[i].match(/\d+/g)) {
                                obJARTypeDT.JarType = "A"
                            }
                            else if (JARB[i].match(/\d+/g)) {
                                obJARTypeDT.JarType = "B"
                            }
                        }


                    }

                    if (globalData.arrTDTData[0].ediflg == true && obJARTypeDT.JarType != undefined) {

                        if (productObj.Sys_RotaryType == 'Single') {
                            //tempTDObj.srtTempData = actualProtocol
                            if (obJARTypeDT.JarType == 'A') {
                                var temp = globalData.arrTDTData[0].strsettemp.split('|')[1].trim();
                                globalData.arrTDTData = []
                            }
                            else {
                                var temp = globalData.arrTDTData[0].strsettemp.split('|')[2].trim();
                                globalData.arrTDTData = []
                            }
                            if (isNaN(temp)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID SET TEMPERATURE";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            } else {
                                tempDTObj.Bath_Temp = temp;
                            }
                        }
                        else {
                            tempDTObj.Bath_Temp = globalData.arrTDTData[0].strsettemp.split('|')[1].trim();
                            if (isNaN(tempDTObj.Bath_Temp)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID SET TEMPERATURE";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                            tempDTObj.bsetdata = globalData.arrTDTData[0].strsettemp.split('|')[2].trim();
                            if (isNaN(tempDTObj.bsetdata)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID SET TEMPERATURE";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                            globalData.arrTDTData = []

                        }
                    }




                    var haltDur = actualProtocol.includes("HALT DUR.");
                    if (haltDur == true) {
                        var jar = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                        var haltDuration = actualProtocol;
                        //console.log(haltDuration);
                        if (productObj.Sys_RotaryType == 'Single') {
                            let index = jar.JarType == 'A' ? 1 : 2;

                            if (!await this.isValidTime(haltDuration.split("|")[index].trim())) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = `JAR ${obJARTypeDT.JarType} HALT DURATION,IS NOT VALID`;
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }
                        }
                        else {
                            if (!await this.isValidTime(haltDuration.split("|")[1].trim()) && objInvalid.DT.invalid == false) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A HALT DURATION,IS NOT VALID";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                            if (!await this.isValidTime(haltDuration.split("|")[2].trim()) && objInvalid.DT.invalid == false) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B HALT DURATION,IS NOT VALID";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }
                        }

                        var hdObj = { "A_hd": haltDuration.split("|")[1], "B_hd": haltDuration.split("|")[2] };
                        //globalData.arrDTData.push(hdObj);
                        tempDTObj.arr_heading.push(hdObj);
                    }


                    if (actualProtocol.includes("BATH")) {
                        globalData.arrJARTypeDT.sapoflg = true
                    }
                    var tempMin = actualProtocol.includes("TEMP. MIN.");
                    if (tempMin == true) {

                        var tempMinimum = actualProtocol;
                        var tempMinVal = tempMinimum.split(":")[1];
                        //var tempMinVal1 = tempMinVal.replace(/\s+/g, "|");
                        // var tempMinVal1 = tempMinVal.replace(/[\sNR]+/g, "|");
                        var tempMinVal1 = tempMinVal.replace(/[`!@#$%^&*()_+\=\[\]{};'"\\|,<>\/?~\s\sNR]+/g, "|");
                        // var bathtemp = actualProtocol.charAt(BathIndex);
                        // var Atemp = actualProtocol.charAt(Apointer);
                        // var Btemp = actualProtocol.charAt(Bpointer);

                        if (globalData.arrJARTypeDT.sapoflg == true) {

                            if (productObj.Sys_RotaryType == 'Single') {


                                if (obJARTypeDT.JarType == 'A') {
                                    var A_tempMin = tempMinVal1.split("|")[2] == '--' ? tempMinVal1.split("|")[3] : tempMinVal1.split("|")[2]
                                    var B_tempMin = 0
                                    var tempMinObj = { "A_tempMin": A_tempMin, "B_tempMin": B_tempMin };
                                    if (isNaN(A_tempMin) || A_tempMin.length === 0) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                                else {
                                    var A_tempMin = 0
                                    var B_tempMin = tempMinVal1.split("|")[2] == '--' ? tempMinVal1.split("|")[3] : tempMinVal1.split("|")[2]
                                    var tempMinObj = { "A_tempMin": A_tempMin, "B_tempMin": B_tempMin };
                                    if (isNaN(B_tempMin) || B_tempMin.length === 0) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                            }
                            else {
                                var A_tempMin = tempMinVal1.split("|")[2] == '--' ? 0 : tempMinVal1.split("|")[2]
                                var B_tempMin = tempMinVal1.split("|")[3] == '--' ? 0 : tempMinVal1.split("|")[3]
                                var tempMinObj = { "A_tempMin": A_tempMin, "B_tempMin": B_tempMin };

                                if (isNaN(A_tempMin) || isNaN(B_tempMin) || A_tempMin.length === 0 || B_tempMin.length === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }

                        }
                        else {

                            var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                            var A_Min = tempMinVal1.split("|")[1] == '--' ? 0 : tempMinVal1.split("|")[1]
                            var B_Min = tempMinVal1.split("|")[2] == '--' ? 0 : tempMinVal1.split("|")[2]
                            var tempMinObj = { "A_tempMin": A_Min, "B_tempMin": B_Min };
                            if (productObj.Sys_RotaryType == 'Single' && (A_Min != 0 && B_Min != 0)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            }

                            if (productObj.Sys_RotaryType == 'Single' && obJARTypeDT.JarType === 'A') {
                                if (isNaN(A_Min) || A_Min === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            } else if (productObj.Sys_RotaryType == 'Single' && obJARTypeDT.JarType === 'B') {
                                if (isNaN(B_Min) || B_Min === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            } else if (productObj.Sys_RotaryType == 'Double') {
                                if (isNaN(A_Min) || A_Min === 0 || isNaN(B_Min) || B_Min === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }

                        }

                        if (tempMinVal1.split("|").length == 5) {
                            var A_Min = tempMinVal1.split("|")[2] == '--' ? 0 : tempMinVal1.split("|")[2]
                            var B_Min = tempMinVal1.split("|")[3] == '--' ? 0 : tempMinVal1.split("|")[3]
                            if (productObj.Sys_RotaryType == 'Single' && (A_Min != 0 && B_Min != 0)) {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";

                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                        }

                        //== '--' ? 0 : newDTData[3].A_tempMin
                        //globalData.arrDTData.push(tempMinObj);
                        tempDTObj.arr_heading.push(tempMinObj);
                    }

                    var tempMax = actualProtocol.includes("TEMP. MAX.");
                    if (tempMax == true) {
                        var tempMaximum = actualProtocol;
                        var tempMaxVal = tempMaximum.split(":")[1];
                        //var tempMaxVal1 = tempMaxVal.replace(/\s+/g, "|");
                        var tempMaxVal1 = tempMaxVal.replace(/[\sNR]+/g, "|");
                        if (globalData.arrJARTypeDT.sapoflg == true) {
                            if (productObj.Sys_RotaryType == 'Single') {
                                if (obJARTypeDT.JarType == 'A') {
                                    var A_tempMax = tempMaxVal1.split("|")[2] == '--' ? tempMaxVal1.split("|")[3] : tempMaxVal1.split("|")[2]
                                    var B_tempMax = 0
                                    var tempMaxObj = { "A_tempMax": A_tempMax, "B_tempMax": B_tempMax };
                                    if (isNaN(A_tempMax) || A_tempMax.length === 0) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                                else {
                                    var A_tempMax = 0
                                    var B_tempMax = tempMaxVal1.split("|")[2] == '--' ? tempMaxVal1.split("|")[3] : tempMaxVal1.split("|")[2]
                                    var tempMaxObj = { "A_tempMax": A_tempMax, "B_tempMax": B_tempMax };
                                    if (isNaN(B_tempMax) || B_tempMax.length === 0) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                            }
                            else {
                                var A_tempMax = tempMaxVal1.split("|")[2]
                                var B_tempMax = tempMaxVal1.split("|")[3]
                                var tempMaxObj = { "A_tempMax": A_tempMax, "B_tempMax": B_tempMax };
                                if (isNaN(A_tempMax) || isNaN(B_tempMax) || A_tempMax.length === 0 || B_tempMax.length === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }

                        }
                        else {
                            var A_tempMax = tempMaxVal1.split("|")[1] == '--' ? 0 : tempMaxVal1.split("|")[1];
                            var B_tempMax = tempMaxVal1.split("|")[2] == '--' ? 0 : tempMaxVal1.split("|")[2];
                            var tempMaxObj = { "A_tempMax": A_tempMax, "B_tempMax": B_tempMax };
                            var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                            // globalData.arrDTData.push(tempMaxObj);

                            if (productObj.Sys_RotaryType == 'Single' && obJARTypeDT.JarType === 'A') {
                                if (isNaN(A_tempMax) || A_tempMax === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            } else if (productObj.Sys_RotaryType == 'Single' && obJARTypeDT.JarType === 'B') {
                                if (isNaN(B_tempMax) || B_tempMax === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            } else if (productObj.Sys_RotaryType == 'Double') {
                                if (isNaN(A_tempMax) || A_tempMax === 0 || isNaN(B_tempMax) || B_tempMax === 0) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }

                        }
                        tempDTObj.arr_heading.push(tempMaxObj);
                    }

                    var sign = actualProtocol.includes("SIGNATURE");
                    var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
                    if (sign == true && !objInvalid.DT.invalid) {
                        let tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                        var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                        //let tempmin = tempDTObj.arr_heading.filter(obj => obj.A_tempMin);

                        if (tempDTObj.arr_heading.length == 5) {
                            let A_MAX = tempDTObj.arr_heading.filter(obj => obj.A_tempMax);
                            let B_MAX = tempDTObj.arr_heading.filter(obj => obj.B_tempMax);

                            let A_MIN = tempDTObj.arr_heading.filter(obj => obj.A_tempMin);
                            let B_MIN = tempDTObj.arr_heading.filter(obj => obj.B_tempMin);

                            let tempmax = A_MAX.length == 0 ? B_MAX : A_MAX;
                            let tempmin = A_MIN.length == 0 ? B_MIN : A_MIN;

                            let productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                            if (productObj.Sys_RotaryType == 'Single') {
                                if (obJARTypeDT.JarType == 'A') {
                                    let A_tempMin = tempmin[0].A_tempMin
                                    let A_tempMax = tempmax[0].A_tempMax
                                    if (parseFloat(A_tempMin) > parseFloat(A_tempMax)) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = `JAR A Temp min > JAR A Temp max`;
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }

                                }
                                else {
                                    let B_tempMin = tempmin[0].B_tempMin
                                    let B_tempMax = tempmax[0].B_tempMax
                                    if (parseFloat(B_tempMin) > parseFloat(B_tempMax)) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = `JAR B Temp min > JAR B Temp max`;
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }

                            }
                            else {
                                let B_tempMin = tempmin[0].B_tempMin
                                let B_tempMax = tempmax[0].B_tempMax
                                let A_tempMin = tempmin[0].A_tempMin
                                let A_tempMax = tempmax[0].A_tempMax

                                if (parseFloat(A_tempMin) > parseFloat(A_tempMax) || parseFloat(B_tempMin) > parseFloat(B_tempMax)) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = `JAR A or B Temp min > JAR A or B Temp max`;
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }


                            }


                            var signature = actualProtocol;
                            //globalData.arrDTData.push(signature);
                            bulkDataFlag.flgDTFlag = false;
                        } else {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID TEMPERATURE";
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }
                    }
                }


                return tdValue;
            }
            else {
                /**
                * @description We are here setting TD000 and HD000 to true
                */
                globalData.arrTDTData = []
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                globalData.arrJARTypeDT.sapoflg = false
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                console.log(tempTDHD)
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
                    //let tempDTData = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                    var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                    var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                    if (tempTDObj.rotaryType == "Single") {
                        var endTime = "00:00:00"
                        if (objJARTypeDT.JarType == "A") {
                            for (var obj of tempTDObj.arr_reading) {
                                if (obj.A.trim() > endTime) {
                                    endTime = obj.A.trim();
                                }
                            }
                            if (endTime == "00:00:00") {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID Reading Time";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                        }
                        if (objJARTypeDT.JarType == "B") {
                            for (var obj of tempTDObj.arr_reading) {
                                if (obj.B.trim() > endTime) {
                                    endTime = obj.B.trim();
                                }
                            }
                            if (endTime == "00:00:00") {
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.DT.invalid = true;
                                objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID Reading Time";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            }
                        }
                    }
                    else {
                        var endTimeA = "00:00:00"
                        var endTimeB = "00:00:00"
                        for (var obj of tempTDObj.arr_reading) {
                            if (obj.A.trim() > endTimeA) {
                                endTimeA = obj.A.trim();
                            }
                            if (obj.B.trim() > endTimeB) {
                                endTimeB = obj.B.trim();
                            }
                        }
                        if (endTimeA == "00:00:00" || endTimeB == "00:00:00") {
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,INVALID Reading Time";
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        }
                    }
                    if ((objInvalid != undefined && objInvalid.DT.invalid == true) || tempTDObj.arr_heading.length != 5 || tempTDObj.Bath_Temp == undefined ||
                        tempTDObj.basketType == undefined || tempTDObj.arr_reading.length > 6 || tempTDObj.arr_reading.length == 0) {
                        /**
                         * @description HERE WE MUST EMPTY `arr_heading` AND `arr_reading` after invalid data
                         * because array may contain invalid data
                         */

                        if (tempTDObj == undefined) {
                            globalData.arrDTData.push({
                                idsNo: idsNo, arr_heading: [], arr_reading: [], arr_info: [],
                                rotaryType: undefined,
                                mode: undefined,
                                Bath_Temp: undefined,
                                bsetdata: undefined,


                            })
                        } else {
                            tempTDObj.arr_heading = [];
                            tempTDObj.arr_reading = [];
                            tempTDObj.arr_info = [];
                            tempTDObj.rotaryType = undefined;
                            tempTDObj.mode = undefined;
                            tempTDObj.Bath_Temp = undefined;
                            tempTDObj.bsetdata = undefined;


                        }
                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'DT', flag: 'ABORTED' } });
                        objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', '', 'ended');
                        return `${protocolIncomingType}R40Invalid String,,,,`
                        //return `${protocolIncomingType}R40INVALID DATA,RECEIVED,RETRANSMIT DATA,,`

                    }
                    else {

                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'DT', flag: 'COMPLETED' } });
                        let now = new Date();
                        let tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                        var productlimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
                        console.log(tempDTObj);
                        var newDTData = tempDTObj.arr_heading;
                        var newArrayReading = tempDTObj.arr_reading;
                        var newArrayInfo = tempDTObj.arr_info;
                        var startDate = newArrayInfo[0].A_startDate;
                        startDate = startDate.split("/").reverse().join("-");
                        //var newArrayReading = newDTReading.slice(0, -1);//to remove undefine from array
                        var checkType = protocol.split(',');
                        var responseType = checkType[3].split("");
                        var actualResponseType = responseType[0];
                        var jarA = [], jarB = [];


                        if (newDTData.length != 0) {

                            for (let i = 0; i < newArrayReading.length; i++) {
                                jarA.push(newArrayReading[i].A);
                                jarB.push(newArrayReading[i].B);
                            }

                            var jarType;
                            var timeStatus; // 
                            var endDate;
                            var startTime;
                            var endTime;
                            // == 
                            if (productObj.Sys_RotaryType == 'Single') {
                                var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                                if (objJARTypeDT.JarType == "A") {
                                    jarType = "A";
                                    //Added on 05/09/2020 taking date and time from string for A
                                    startTime = newDTData[0].A_st;
                                    endTime = newDTData[1].A_et;
                                    var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                    var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                    endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                                }
                                else {
                                    jarType = "B";
                                    //Added on 05/09/2020 taking date and time from string for B
                                    startTime = newDTData[0].B_st;
                                    endTime = newDTData[1].B_et;
                                    var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                    var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                    endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                                }
                            } else {
                                //Added on 05/09/2020 taking date and time from string for A (Double Rotory)
                                startTime = newDTData[0].A_st;
                                endTime = newDTData[1].A_et;
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                            }

                            var le, actualRunTime, completeTable, detailTable;
                            if (ProductType.productType == 2 && (productObj.Sys_Area == 'Pallet Coating' || productObj.Sys_Area == 'Coating')) {
                                productObj.Sys_Area = 'Capsule Filling';
                                var res = await objProduct.productData(productObj);
                                productObj.Sys_Area = 'Pallet Coating';
                            } else {
                                var res = await objProduct.productData(productObj);
                            }

                            actualRunTime = ProductType.productType == 1 ? res[1].Param13_Nom : res[1].Param6_Nom;
                            completeTable = ProductType.productType == 1 ? 'tbl_tab_master13' : 'tbl_cap_master6';
                            detailTable = ProductType.productType == 1 ? 'tbl_tab_detail13' : 'tbl_cap_detail6';
                            var DTJAR = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                            //var jartype = `jar${objJARTypeDT.JarType}`;
                            var masterCompleteData = {
                                str_tableName: completeTable,
                                data: [
                                    { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                    { str_colName: 'InstruId', value: 1 },
                                    { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                    { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                    { str_colName: 'ProductType', value: ProductType.productType },
                                    // { str_colName: 'Qty', value: productlimits.DT.noOfSamples },
                                    { str_colName: 'Qty', value: 6 },
                                    { str_colName: 'Idsno', value: IdsNo },
                                    { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                    { str_colName: 'BalanceId', value: currentCubicleObj.Sys_BalID },
                                    { str_colName: 'VernierId', value: currentCubicleObj.Sys_VernierID },
                                    { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                    { str_colName: 'UserId', value: tempUserObject.UserId },
                                    { str_colName: 'UserName', value: tempUserObject.UserName },
                                    { str_colName: 'PrDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : startDate },
                                    { str_colName: 'PrTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : startTime },
                                    { str_colName: 'PrEndDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : endDate },
                                    { str_colName: 'PrEndTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : endTime },
                                    { str_colName: 'Side', value: productObj.Sys_RotaryType == 'Single' ? (jarType == "A") ? "NA" : "NA" : "LHS" },
                                    { str_colName: 'WgmtModeNo', value: 13 },
                                    { str_colName: 'Nom', value: ProductType.productType == 1 ? res[1].Param13_Nom : res[1].Param6_Nom },
                                    { str_colName: 'T1NegTol', value: ProductType.productType == 1 ? res[1].Param13_T1Neg : res[1].Param6_T1Neg },
                                    { str_colName: 'T1PosTol', value: ProductType.productType == 1 ? res[1].Param13_T1Pos : res[1].Param6_T1Pos },
                                    { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                    { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                    { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                    { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                    { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                    { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                    { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                    { str_colName: 'RepoLabel11', value: currentCubicleObj.Sys_Validation },
                                    { str_colName: 'PrintNo', value: 0 },
                                    { str_colName: 'IsArchived', value: 0 },
                                    { str_colName: 'GraphType', value: 0 },
                                    { str_colName: 'BatchComplete', value: 0 },
                                    { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                    { str_colName: 'Version', value: productObj.Sys_Version },
                                    { str_colName: 'DTID', value: currentCubicleObj.Sys_DTID },
                                    { str_colName: 'Media', value: productObj.Sys_media },
                                    { str_colName: 'Lot', value: objLotData.LotNo },
                                    { str_colName: 'Area', value: productObj.Sys_Area },
                                    { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                    { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                    { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                    { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                    { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                                    { str_colName: 'DT_Mode', value: tempDTObj.mode == undefined ? 'Registration' : tempDTObj.mode },
                                    { str_colName: 'DT_BasketType', value: tempDTObj.basketType },
                                    { str_colName: 'DT_Jar', value: DTJAR.JarType },
                                    { str_colName: 'DT_SetTemp', value: tempDTObj.Bath_Temp },
                                ]
                            }

                            if (jarType == "A") {
                                masterCompleteData.data.push(

                                    { str_colName: 'MinTemp', value: newDTData[3].A_tempMin },
                                    { str_colName: 'MaxTemp', value: newDTData[4].A_tempMax },

                                );
                            }
                            else if (jarType == "B") {
                                masterCompleteData.data.push(

                                    { str_colName: 'MinTemp', value: newDTData[3].B_tempMin },
                                    { str_colName: 'MaxTemp', value: newDTData[4].B_tempMax },

                                );
                            }
                            else {
                                masterCompleteData.data.push(

                                    { str_colName: 'MinTemp', value: newDTData[3].A_tempMin },
                                    { str_colName: 'MaxTemp', value: newDTData[4].A_tempMax },

                                );
                            }


                            if (ProductType.productType == 2) {
                                masterCompleteData.data.push(
                                    { str_colName: 'Sys_MachineCap', value: productObj.Sys_MachineCap })
                            }
                            //console.log(masterCompleteData);
                            var resultCompleteData = await database.save(masterCompleteData);
                            var lastInsertedID = resultCompleteData[0].insertId;

                            if (jarType == "A") {
                                var startTime = newDTData[0].A_st.trim();
                                var endTime = newDTData[1].A_et.trim();
                                var startTimeval = moment(startTime, 'HH:mm:ss');
                                var endTimeval = moment(endTime, 'HH:mm:ss');
                                var runTime = moment.utc(moment(endTimeval, "HH:mm:ss")
                                    .diff(moment(startTimeval, "HH:mm:ss"))).format("HH:mm:ss")
                                var hDur = newDTData[2].A_hd.trim();

                                for (const [i, dtVal] of jarA.entries()) {

                                    var endTmSS = moment(startTime, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObj = {
                                        str_tableName: detailTable,
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedID },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: "NA" },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            // { str_colName: 'DT_Temp', value: 0 },
                                            { str_colName: 'DT_Temp', value: newDTData[4].A_tempMax },//as discussed with sheetal and shraddhanad for hosure
                                            { str_colName: 'DT_StartTm', value: startTime },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            // { str_colName: 'DT_RunTime', value: runTime },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDur }
                                        ]
                                    }
                                    //console.log(insertDetailObj);
                                    var jarARes = await database.save(insertDetailObj);
                                }


                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;


                                var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {
                                    var returnBatchRes = await objBatchSummary.saveBatchSummaryDT(lastInsertedID, 0, productObj, IdsNo);
                                }
                                var objUpdateValidation = {
                                    str_tableName: "tbl_cubical",
                                    data: [
                                        { str_colName: 'Sys_Validation', value: 0 },
                                    ],
                                    condition: [
                                        { str_colName: 'Sys_IDSNo', value: IdsNo },
                                    ]
                                }
                                await database.update(objUpdateValidation);
                                // //Online printing code of Jar B 
                                // const objIOnlinePrint = new IOnlinePrint();
                                // objIOnlinePrint.RepSerNo = lastInsertedID;
                                // objIOnlinePrint.reportOption = "Disintegration Tester";
                                // objIOnlinePrint.testType = "Regular";
                                // objIOnlinePrint.userId = tempUserObject.UserId;
                                // objIOnlinePrint.username = tempUserObject.UserName;
                                // objIOnlinePrint.idsNo = IdsNo
                                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

                                // await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
                                le = `${protocolIncomingType}` + `R1`;
                                var tempFlagAJar = false; // For time
                                var tempFlagTemp = false // for Tempreture
                                for (const [i, dtVal] of jarA.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        // return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }
                                if ((parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].A_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].A_tempMax))) {
                                    tempFlagTemp = true;
                                }
                                if (tempFlagTemp == true || tempFlagAJar == true) {
                                    le = `${protocolIncomingType}` + `R2`;
                                }
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'DT Weighment Completed on IDS' + IdsNo });
                                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                                objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', 'DT', 'completed');
                                //empty object when data is completly saved 
                                var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                                if (tempTDObj == undefined) {
                                    globalData.arrDTData.push({
                                        idsNo: IdsNo, arr_heading: [], arr_reading: [], arr_info: [],
                                        rotaryType: undefined,
                                        mode: undefined,
                                        basketType: undefined,
                                        Bath_Temp: undefined

                                    })
                                } else {
                                    tempTDObj.arr_heading = [];
                                    tempTDObj.arr_reading = [];
                                    tempTDObj.arr_info = [];
                                    tempTDObj.rotaryType = undefined;
                                    tempTDObj.mode = undefined;
                                    tempTDObj.basketType = undefined;
                                    tempTDObj.Bath_Temp = undefined;

                                }
                                return le;

                            }
                            else if (jarType == "B") {
                                var startTime = newDTData[0].B_st.trim();
                                var endTime = newDTData[1].B_et.trim();
                                var startTimeval = moment(startTime, 'HH:mm:ss');
                                var endTimeval = moment(endTime, 'HH:mm:ss');
                                var runTime = moment.utc(moment(endTimeval, "HH:mm:ss")
                                    .diff(moment(startTimeval, "HH:mm:ss"))).format("HH:mm:ss")
                                var hDur = newDTData[2].B_hd.trim();

                                for (const [i, dtVal] of jarB.entries()) {

                                    var endTmSS = moment(startTime, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObj = {
                                        str_tableName: detailTable,
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedID },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: "NA" },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            { str_colName: 'DT_Temp', value: newDTData[4].B_tempMax },
                                            { str_colName: 'DT_StartTm', value: startTime },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDur }
                                        ]
                                    }

                                    var jarBRes = await database.save(insertDetailObj);


                                }

                                var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {
                                    var returnBatchRes = await objBatchSummary.saveBatchSummaryDT(lastInsertedID, 0, productObj, IdsNo);
                                }
                                var objUpdateValidation = {
                                    str_tableName: "tbl_cubical",
                                    data: [
                                        { str_colName: 'Sys_Validation', value: 0 },
                                    ],
                                    condition: [
                                        { str_colName: 'Sys_IDSNo', value: IdsNo },
                                    ]
                                }
                                await database.update(objUpdateValidation);
                                //Online printing code of Jar B 
                                // const objIOnlinePrint = new IOnlinePrint();
                                // objIOnlinePrint.RepSerNo = lastInsertedID;
                                // objIOnlinePrint.reportOption = "Disintegration Tester";
                                // objIOnlinePrint.testType = "Regular";
                                // objIOnlinePrint.userId = tempUserObject.UserId;
                                // objIOnlinePrint.username = tempUserObject.UserName;
                                // objIOnlinePrint.idsNo = IdsNo
                                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

                                // await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'DT Weighment Completed on IDS' + IdsNo });
                                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                                objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', 'DT', 'completed');
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;


                                le = `${protocolIncomingType}` + `R1`;
                                var tempFlagAJar = false; // For time
                                var tempFlagTemp = false // for Tempreture
                                for (const [i, dtVal] of jarB.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        //return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }
                                if ((parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].B_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].B_tempMax))) {
                                    tempFlagTemp = true;
                                }
                                if (tempFlagTemp == true || tempFlagAJar == true) {
                                    le = `${protocolIncomingType}` + `R2`;
                                }
                                //empty object when data is completly saved 
                                var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                                if (tempTDObj == undefined) {
                                    globalData.arrDTData.push({
                                        idsNo: IdsNo, arr_heading: [], arr_reading: [], arr_info: [],
                                        rotaryType: undefined,
                                        mode: undefined,
                                        basketType: undefined,
                                        Bath_Temp: undefined



                                    })
                                } else {
                                    tempTDObj.arr_heading = [];
                                    tempTDObj.arr_reading = [];
                                    tempTDObj.arr_info = [];
                                    tempDTObj.rotaryType = undefined;
                                    tempDTObj.mode = undefined;
                                    tempTDObj.basketType = undefined;
                                    tempTDObj.Bath_Temp = undefined;

                                }
                                return le;

                            }
                            else {

                                // var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                                // if (objJARTypeDT.JarType == "A") {
                                //     jarType = "A";
                                // }
                                // else {
                                //     jarType = "B";
                                // }

                                var startTimeA = newDTData[0].A_st.trim();
                                var endTimeA = newDTData[1].A_et.trim();
                                var startTimevalA = moment(startTimeA, 'HH:mm:ss');
                                var endTimevalA = moment(endTimeA, 'HH:mm:ss');
                                var runTimeA = moment.utc(moment(endTimevalA, "HH:mm:ss")
                                    .diff(moment(startTimevalA, "HH:mm:ss"))).format("HH:mm:ss")
                                var hDurA = newDTData[2].A_hd.trim();

                                var startTimeB = newDTData[0].B_st.trim();
                                var endTimeB = newDTData[1].B_et.trim();
                                var startTimevalB = moment(startTimeB, 'HH:mm:ss');
                                var endTimevalB = moment(endTimeB, 'HH:mm:ss');
                                var runTimeB = moment.utc(moment(endTimevalB, "HH:mm:ss")
                                    .diff(moment(startTimevalB, "HH:mm:ss"))).format("HH:mm:ss");
                                var hDurB = newDTData[2].B_hd.trim();



                                for (const [i, dtVal] of jarA.entries()) {
                                    var endTmSS = moment(startTimeA, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObjA = {
                                        str_tableName: detailTable,
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedID },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: 'LHS' },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            { str_colName: 'DT_Temp', value: newDTData[4].A_tempMax },
                                            { str_colName: 'DT_StartTm', value: startTimeA },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            //{ str_colName: 'DT_RunTime', value: runTimeA },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDurA }
                                        ]
                                    }
                                    var ResJarA = await database.save(insertDetailObjA);

                                }
                                //Online printing code of Jar A 
                                // const objIOnlinePrintA = new IOnlinePrint();
                                // objIOnlinePrintA.RepSerNo = lastInsertedID;
                                // objIOnlinePrintA.reportOption = "Disintegration Tester";
                                // objIOnlinePrintA.testType = "Regular";
                                // objIOnlinePrintA.userId = tempUserObject.UserId;
                                // objIOnlinePrintA.username = tempUserObject.UserName;
                                // objIOnlinePrintA.idsNo = IdsNo
                                // const objPrinterNameA = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                // const a = await objPrintReport.generateOnlineReportAsync(objIOnlinePrintA, objPrinterNameA.Sys_PrinterName)
                                startTime = newDTData[0].B_st;
                                endTime = newDTData[1].B_et;
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                                var JARDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                                var templimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
                                /* inserting Data of double rotatry for B*/
                                var masterCompleteDataJarB = {
                                    str_tableName: completeTable,
                                    data: [
                                        { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                        { str_colName: 'InstruId', value: 1 },
                                        { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                        { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                        { str_colName: 'ProductType', value: ProductType.productType },
                                        // { str_colName: 'Qty', value: templimits.DT.noOfSamples },
                                        { str_colName: 'Qty', value: 6 },
                                        { str_colName: 'Idsno', value: IdsNo },
                                        { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                        { str_colName: 'BalanceId', value: currentCubicleObj.Sys_BalID },
                                        { str_colName: 'VernierId', value: currentCubicleObj.Sys_VernierID },
                                        { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                        { str_colName: 'UserId', value: tempUserObject.UserId },
                                        { str_colName: 'UserName', value: tempUserObject.UserName },
                                        { str_colName: 'PrDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : startDate },
                                        { str_colName: 'PrTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : startTime },
                                        { str_colName: 'PrEndDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : endDate },
                                        { str_colName: 'PrEndTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : endTime },
                                        { str_colName: 'Side', value: 'RHS' },
                                        { str_colName: 'Lot', value: objLotData.LotNo },
                                        { str_colName: 'WgmtModeNo', value: 13 },
                                        { str_colName: 'Nom', value: ProductType.productType == 1 ? res[1].Param13_Nom : res[1].Param6_Nom },
                                        { str_colName: 'T1NegTol', value: ProductType.productType == 1 ? res[1].Param13_T1Neg : res[1].Param6_T1Neg },
                                        { str_colName: 'T1PosTol', value: ProductType.productType == 1 ? res[1].Param13_T1Pos : res[1].Param6_T1Pos },
                                        { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                        { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                        { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                        { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                        { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                        { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                        { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                        { str_colName: 'RepoLabel11', value: currentCubicleObj.Sys_Validation },
                                        { str_colName: 'PrintNo', value: 0 },
                                        { str_colName: 'IsArchived', value: 0 },
                                        { str_colName: 'GraphType', value: 0 },
                                        { str_colName: 'BatchComplete', value: 0 },
                                        { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                        { str_colName: 'Version', value: productObj.Sys_Version },
                                        { str_colName: 'MinTemp', value: newDTData[3].B_tempMin },
                                        { str_colName: 'MaxTemp', value: newDTData[4].B_tempMax },
                                        { str_colName: 'DTID', value: currentCubicleObj.Sys_DTID },
                                        { str_colName: 'Media', value: productObj.Sys_media },
                                        { str_colName: 'Area', value: productObj.Sys_Area },
                                        { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                        { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                        { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                        { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                        { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                                        { str_colName: 'DT_Mode', value: tempDTObj.mode == undefined ? 'Registration' : tempDTObj.mode },
                                        { str_colName: 'DT_BasketType', value: tempDTObj.basketType },
                                        { str_colName: 'DT_Jar', value: "B" },
                                        { str_colName: 'DT_SetTemp', value: tempDTObj.bsetdata },
                                    ]
                                }
                                var resultCompleteDataJarB = await database.save(masterCompleteDataJarB);

                                var lastInsertedIDJarB = resultCompleteDataJarB[0].insertId;
                                for (const [i, dtVal] of jarB.entries()) {
                                    var endTmSS = moment(startTimeB, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObjB = {
                                        str_tableName: detailTable,
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedIDJarB },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: 'RHS' },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            { str_colName: 'DT_Temp', value: newDTData[4].B_tempMax },
                                            { str_colName: 'DT_StartTm', value: startTimeB },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            //{ str_colName: 'DT_RunTime', value: runTimeB },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDurB }
                                        ]
                                    }

                                    var ResDetailB = await database.save(insertDetailObjB);

                                }
                                /* end of  inserting Data of double rotatry for B*/



                                var objUpdateValidation = {
                                    str_tableName: "tbl_cubical",
                                    data: [
                                        { str_colName: 'Sys_Validation', value: 0 },
                                    ],
                                    condition: [
                                        { str_colName: 'Sys_IDSNo', value: IdsNo },
                                    ]
                                }


                                var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {
                                    var returnBatchRes = await objBatchSummary.saveBatchSummaryDT(lastInsertedID, lastInsertedIDJarB, productObj, IdsNo);
                                }

                                var resValidation = await database.update(objUpdateValidation);
                                // Activity Log for DT weighmnet Completed
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'DT Weighment Completed on IDS' + IdsNo });
                                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                                // Instrument usage for DT complete
                                objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', '', 'completed')




                                //Online printing code of Jar B 


                                //   if (a == true) {
                                // const objIOnlinePrintB = new IOnlinePrint();
                                // objIOnlinePrintB.RepSerNo = lastInsertedIDJarB;
                                // objIOnlinePrintB.reportOption = "Disintegration Tester";
                                // objIOnlinePrintB.testType = "Regular";
                                // objIOnlinePrintB.userId = tempUserObject.UserId;
                                // objIOnlinePrintB.username = tempUserObject.UserName;
                                // objIOnlinePrintB.idsNo = IdsNo
                                // const objPrinterNameB = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

                                // const b = await objPrintReport.generateOnlineReportAsync(objIOnlinePrintB, objPrinterNameB.Sys_PrinterName);
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                // if ((parseInt(actualRunTime.replace(regExp, "$1$2$3")) > parseInt(runTimeA.replace(regExp, "$1$2$3")))
                                //     && (parseInt(actualRunTime.replace(regExp, "$1$2$3")) > parseInt(runTimeB.replace(regExp, "$1$2$3")))) {
                                //     return le = `${protocolIncomingType}` + `R1`;
                                // } else {
                                //     return le = `${protocolIncomingType}` + `R2`;
                                // }
                                //  }

                                le = `${protocolIncomingType}` + `R1`

                                var tempFlagAJar = false; // For time
                                var tempFlagTemp = false // for Tempreture
                                for (const [i, dtVal] of jarA.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        // return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }


                                for (const [i, dtVal] of jarB.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        // return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }

                                if ((parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].A_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].B_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].A_tempMax)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].B_tempMax))) {
                                    tempFlagTemp = true;
                                }
                                if (tempFlagTemp == true || tempFlagAJar == true) {
                                    le = `${protocolIncomingType}` + `R2`;
                                }
                                //empty object when data is completly saved 
                                var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                                if (tempTDObj == undefined) {
                                    globalData.arrDTData.push({
                                        idsNo: idsNo, arr_heading: [], arr_reading: [], arr_info: [],
                                        rotaryType: undefined,
                                        mode: undefined,
                                        Bath_Temp: undefined,
                                    })
                                } else {
                                    tempTDObj.arr_heading = [];
                                    tempTDObj.arr_reading = [];
                                    tempTDObj.arr_info = [];
                                    tempDTObj.rotaryType = undefined;
                                    tempDTObj.mode = undefined;
                                    tempDTObj.Bath_Temp = undefined;
                                }
                                return le;


                            }
                            //batch Summary record
                        }


                    }
                } else {
                    console.log('REPEAT_COUNT FOR TDHD000');
                    return '+';
                }

            }// else ends

        } catch (err) {
            var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
            if (tempTDObj == undefined) {
                globalData.arrDTData.push({ idsNo: idsNo, arr_heading: [], arr_reading: [], arr_info: [], rotaryType: undefined, mode: undefined })
            } else {
                tempTDObj.arr_heading = [];
                tempTDObj.arr_reading = [];
                tempTDObj.arr_info = [];
                tempTDObj.rotaryType = undefined;
                tempTDObj.mode = undefined;
                tempTDObj.Bath_Temp = undefined;

            }
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log(err);
        }

    }

    /**
     * 
     * @param {*} IdsNo 
     * @param {*} protocol 
     * @description for Electrolab-ED3PO
     */

    async isValidTime(time) {
        try {
            let [hh, mm, ss] = time.split(':');
            if (hh != undefined && mm != undefined && ss != undefined) {
                if (hh.length != 0 && mm.length != 0 && ss.length != 0) {
                    if ((Number(hh) || hh == 0) && (Number(mm) || mm == 0) && (Number(ss) || ss == 0)) {
                        if (hh > 23 || mm > 59 || ss > 59) {
                            return false;
                        } else {
                            return true;
                        }
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } catch (error) {
            console.log(error);
        }

    }

    async validateTwoSaTime(countOne, productObj, JARTypeobj, IdsNo) {
        var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
        if (productObj.Sys_RotaryType == 'Single' && JARTypeobj.JarType === 'A') {
            if (!await this.isValidTime(countOne.split("|")[1].trim())) {
                const objBulkInvalid = new bulkInvalid();
                objBulkInvalid.invalidObj.idsNo = IdsNo;
                objBulkInvalid.invalidObj.DT.invalid = true;
                objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Time Received`;
                Object.assign(objInvalid, objBulkInvalid.invalidObj);
            }

        } else if (productObj.Sys_RotaryType == 'Single' && JARTypeobj.JarType === 'B') {
            if (!await this.isValidTime(countOne.split("|")[2].trim())) {
                const objBulkInvalid = new bulkInvalid();
                objBulkInvalid.invalidObj.idsNo = IdsNo;
                objBulkInvalid.invalidObj.DT.invalid = true;
                objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Time Received`;
                Object.assign(objInvalid, objBulkInvalid.invalidObj);
            }

        } else {
            if (!await this.isValidTime(countOne.split("|")[1].trim()) || await this.isValidTime(countOne.split("|")[2].trim())) {
                const objBulkInvalid = new bulkInvalid();
                objBulkInvalid.invalidObj.idsNo = IdsNo;
                objBulkInvalid.invalidObj.DT.invalid = true;
                objBulkInvalid.invalidObj.DT.invalidMsg = `Invalid Reading Time Received`;
                Object.assign(objInvalid, objBulkInvalid.invalidObj);
            }
        }
    }


    async insertBulkWeighmentDTED3PO(IdsNo, protocol) {
        try {
            var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var currentCubicleObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var actualProtocol = protocol;
            var tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var tdValue = actualProtocol.substring(0, 5);
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var objArrLimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
            var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
            var protocolIncomingType = tdValue.substring(0, 1);//Check incoming Protocol is from "T" or "H"
            if (tdValue != protocolIncomingType + "D000") {
                /**
                * @description We are here setting TD000 and HD000 to false
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }
                /************************************************************* */
                var bulkDataFlag = globalData.arrBulkDataFlag.find(k => k.IdsNo == IdsNo);
                var tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);

                var jarType = "A";
                var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                if (objJARTypeDT != undefined) {
                    if (objJARTypeDT.JarType == "A") {
                        jarType = "A";
                    }
                    else if (objJARTypeDT.JarType == "B") {
                        jarType = "B";
                    } else {
                        jarType = "C";
                    }
                }

                var testSummaryVal = actualProtocol.includes("START DATE");
                if (testSummaryVal == true) {
                    bulkDataFlag.flgDTFlag = true;
                    // Activity Log for DT weighmnet started
                    var objActivity = {};
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'DT Weighment Started on IDS' + IdsNo });
                    objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                    // Instrument usage for DT start
                    objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', 'DT', 'started');
                    // Added on 05-09-2020 to support date complication by pradip
                    var str_startDate = actualProtocol.split('START DATE')[1].split(':')[1]
                    str_startDate = str_startDate.substring(0, str_startDate.length - 2).trim();
                    var stDateObj = { "A_startDate": str_startDate };
                    //globalData.arrDTData.push(stObj);
                    tempDTObj.arr_info.push(stDateObj);
                    const objBulkInvalid = new bulkInvalid();
                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                    objBulkInvalid.invalidObj.DT.invalid = false;
                    objBulkInvalid.invalidObj.DT.invalidMsg = "";
                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                }
                if (bulkDataFlag.flgDTFlag == true) {
                    var testStartTime = actualProtocol.includes("START TIME");
                    if (testStartTime == true) {
                        var startTime = actualProtocol;
                        if (!moment(startTime.split(' ')[startTime.split(' ').length - 1].slice(0, -2), TimeFormat, true).isValid()) {

                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR START TIME,IS NOT VALID";
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);

                        }
                        var stObj = { "A_st": startTime.split(' ')[startTime.split(' ').length - 1].slice(0, -2) };
                        //globalData.arrDTData.push(stObj);
                        tempDTObj.arr_heading.push(stObj);
                    }

                    var testEndTime = actualProtocol.includes("END TIME");
                    if (testEndTime == true) {
                        var endTime = actualProtocol;
                        if (!moment(endTime.split(' ')[endTime.split(' ').length - 1].slice(0, -2), TimeFormat, true).isValid()) {

                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR END TIME,IS NOT VALID";
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);

                        }
                        var etObj = { "A_et": endTime.split(' ')[endTime.split(' ').length - 1].slice(0, -2) };
                        //globalData.arrDTData.push(etObj);
                        tempDTObj.arr_heading.push(etObj);
                    }

                    var BathTemp = actualProtocol.includes("BATH TEMP.")

                    if (BathTemp == true) {
                        var Battemp = actualProtocol.split(':')[1]
                        Battemp = Battemp.replace(/[NRrn]+/g, "|").trim();
                        Battemp = Battemp.split("|")[0];
                        tempDTObj.Bath_Temp = parseFloat(Battemp);
                    }

                    var testBasketType = actualProtocol.includes("BASKET TYPE ");
                    if (testBasketType == true) {
                        var basketType = actualProtocol.split(":")[1];
                        basketType = basketType.split(/[NRnr]+/)[0].trim();

                        tempDTObj.basketType = basketType;
                    }



                    var testDurTime = actualProtocol.includes("TEST RUN DURATION");
                    if (testDurTime == true) {
                        var durTime = actualProtocol;
                        if (!moment(durTime.split(' ')[durTime.split(' ').length - 1].slice(0, -2), TimeFormat, true).isValid()) {

                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,TEST RUN DURATION,IS NOT VALID";
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);

                        }
                        var c1Obj = { "A": durTime.split(' ')[durTime.split(' ').length - 1].slice(0, -2) };
                        if (c1Obj.A != undefined) {
                            tempDTObj.arr_reading.push(c1Obj);
                        }
                    }
                    var haltDur = actualProtocol.includes("TEST HALT DURATION");
                    if (haltDur == true) {
                        var haltDuration = actualProtocol;
                        if (!moment(haltDuration.split(' ')[haltDuration.split(' ').length - 1].slice(0, -2), TimeFormat, true).isValid()) {

                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;
                            objBulkInvalid.invalidObj.DT.invalid = true;
                            objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,HALT TIME,IS NOT VALID";
                            Object.assign(objInvalid, objBulkInvalid.invalidObj);

                        }
                        var hdObj = { "A_hd": haltDuration.split(' ')[haltDuration.split(' ').length - 1].slice(0, -2) };
                        //globalData.arrDTData.push(hdObj);
                        tempDTObj.arr_heading.push(hdObj);
                    }


                    var jartype = actualProtocol.includes('JAR');
                    if (jartype) {
                        var obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                        console.log(actualProtocol);
                        var jarVal = actualProtocol.replace(/\s\s+/g, ' ');
                        jarVal = jarVal.split(" ");
                        jarType = jarVal[2];
                        var jar = jarType;
                        if (obJARTypeDT == undefined) {
                            globalData.arrJARTypeDT.push({
                                idsNo: IdsNo,
                                JarType: jar
                            })
                        } else {
                            obJARTypeDT.idsNo = IdsNo;
                            obJARTypeDT.JarType = obJARTypeDT.JarType;
                        }
                    }






                    var tempMax = actualProtocol.includes(`JAR ${jarType} TEMP`);
                    if (tempMax == true) {
                        var tempMaximum = actualProtocol;
                        var tempMaxVal = tempMaximum.split(':')[1].split('deg')[0].trim();
                        // var tempMaxVal1 = tempMaxVal.replace(/\s+/g, "|");
                        var tempMaxObj = { "A_tempMax": tempMaxVal };
                        var tempMinObj = { "A_tempMin": tempMaxVal };
                        tempDTObj.arr_heading.push(tempMinObj);
                        tempDTObj.arr_heading.push(tempMaxObj);
                    }
                }
                var sign = actualProtocol.includes("SIGNATURE");
                if (sign == true) {
                    var signature = actualProtocol;
                    //globalData.arrDTData.push(signature);
                    bulkDataFlag.flgDTFlag = false;
                }
                return tdValue;
            } else {

                /**
               * @description We are here setting TD000 and HD000 to true
               */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                var limitob = globalData.arr_limits.find(k => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    var tempTDOb = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                    if ((objInvalid != undefined && objInvalid.DT.invalid == true) || tempTDOb.arr_heading.length != 5) {
                        /**
                         * @description HERE WE MUST EMPTY `arr_heading` AND `arr_reading` after invalid data
                         * because array may contain invalid data
                         */

                        if (tempTDObj == undefined) {
                            globalData.arrDTData.push({
                                idsNo: IdsNo, arr_heading: [], arr_reading: [],
                                arr_info: [],
                                rotaryType: undefined,
                                basketType: undefined,
                                Bath_Temp: undefined

                            })
                        } else {
                            tempTDObj.arr_heading = [];
                            tempTDObj.arr_reading = [];
                            tempTDObj.arr_info = [];
                            tempTDObj.rotaryType = undefined;
                            tempTDObj.basketType = undefined;
                            tempTDObj.Bath_Temp = undefined;


                        }
                        let JARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                        if (globalData.arrJARTypeDT != null) {
                            globalData.arrJARTypeDT = globalData.arrJARTypeDT.filter(k => k.idsNo != IdsNo)
                        }

                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'DT', flag: 'ABORTED' } });
                        objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', '', 'ended');
                        return `${protocolIncomingType}R40Invalid String,,,,`
                        //return `${protocolIncomingType}R40INVALID DATA,RECEIVED,RETRANSMIT DATA,,`

                    } else {
                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'DT', flag: 'COMPLETED' } });
                        var now = new Date();
                        var tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                        var newDTData = tempDTObj.arr_heading;
                        var newArrayReading = tempDTObj.arr_reading;
                        var newArrayInfo = tempDTObj.arr_info;
                        // Added on 04-09-2020 to support date complication by pradip
                        var startDate = newArrayInfo[0].A_startDate;
                        startDate = startDate.split("/").reverse().join("-");
                        //var newArrayReading = newDTReading.slice(0, -1);//to remove undefine from array
                        var checkType = protocol.split(',');
                        var responseType = checkType[3].split("");
                        var jarA = [], jarB = [];

                        if (newDTData.length != 0) {
                            for (let i = 0; i < newArrayReading.length; i++) {
                                jarA.push(newArrayReading[i].A);
                                // jarB.push(newArrayReading[i].B);
                            }
                        }
                        var jarType;
                        var timeStatus; // 
                        var endDate;
                        var startTime;
                        var endTime;
                        if (productObj.Sys_RotaryType == 'Single') {
                            var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                            if (objJARTypeDT.JarType == "A") {
                                jarType = "A";
                            }
                            else if (objJARTypeDT.JarType == "B") {
                                jarType = "B";
                            } else {
                                jarType = "C";
                            }
                        }
                        // Added on 04-09-2020 to support date complication by pradip
                        startTime = newDTData[0].A_st;
                        endTime = newDTData[1].A_et;
                        var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                        var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                        endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                        /*********************************************************** */
                        var le, actualRunTime;
                        var res = await objProduct.productData(productObj, 'tbl_product_capsule');
                        actualRunTime = ProductType.productType == 2 ? res[1].Param6_Nom : res[1].Param13_Nom;
                        let DTJAR = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                        var masterCompleteData = {
                            str_tableName: ProductType.productType == 2 ? 'tbl_cap_master6' : 'tbl_tab_master13',
                            data: [
                                { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                { str_colName: 'InstruId', value: 1 },
                                { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                { str_colName: 'ProductType', value: ProductType.productType },
                                { str_colName: 'Qty', value: limitob.DT.noOfSamples },
                                { str_colName: 'Idsno', value: IdsNo },
                                { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                { str_colName: 'BalanceId', value: currentCubicleObj.Sys_BalID },
                                { str_colName: 'VernierId', value: currentCubicleObj.Sys_VernierID },
                                { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                { str_colName: 'UserId', value: tempUserObject.UserId },
                                { str_colName: 'UserName', value: tempUserObject.UserName },
                                { str_colName: 'PrDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : startDate },
                                { str_colName: 'PrTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : startTime },
                                { str_colName: 'PrEndDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : endDate },
                                { str_colName: 'PrEndTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : endTime },
                                { str_colName: 'Side', value: productObj.Sys_RotaryType == 'Single' ? (jarType == "A") ? "NA" : "NA" : "LHS" },
                                { str_colName: 'WgmtModeNo', value: 13 },
                                { str_colName: 'Nom', value: ProductType.productType == 2 ? res[1].Param6_Nom : res[1].Param13_Nom },
                                { str_colName: 'T1NegTol', value: ProductType.productType == 2 ? res[1].Param6_T1Neg : res[1].Param13_T1Neg },
                                { str_colName: 'T1PosTol', value: ProductType.productType == 2 ? res[1].Param6_T1Pos : res[1].Param13_T1Pos },
                                { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                { str_colName: 'RepoLabel11', value: currentCubicleObj.Sys_Validation },
                                { str_colName: 'PrintNo', value: 0 },
                                { str_colName: 'IsArchived', value: 0 },
                                { str_colName: 'GraphType', value: 0 },
                                { str_colName: 'BatchComplete', value: 0 },
                                { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                { str_colName: 'Version', value: productObj.Sys_Version },
                                { str_colName: 'DTID', value: currentCubicleObj.Sys_DTID },
                                { str_colName: 'Media', value: productObj.Sys_media },
                                { str_colName: 'Lot', value: objLotData.LotNo },
                                { str_colName: 'Area', value: productObj.Sys_Area },
                                { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                                { str_colName: 'DT_BasketType', value: tempDTObj.basketType },
                                { str_colName: 'DT_Jar', value: DTJAR.JarType },
                                { str_colName: 'DT_SetTemp', value: tempDTObj.Bath_Temp },
                                { str_colName: 'DT_Mode', value: tempDTObj.mode == undefined ? 'Dual' : tempDTObj.mode },

                            ]
                        }

                    }

                    masterCompleteData.data.push(
                        { str_colName: 'MinTemp', value: newDTData[2].A_tempMin },
                        { str_colName: 'MaxTemp', value: newDTData[3].A_tempMax },
                    );

                    var resultCompleteData = await database.save(masterCompleteData);
                    var lastInsertedID = resultCompleteData[0].insertId;
                    var startTime = newDTData[0].A_st.trim();
                    var endTime = newDTData[1].A_et.trim();
                    var startTimeval = moment(startTime, 'HH:mm:ss');
                    var endTimeval = moment(endTime, 'HH:mm:ss');
                    var runTime = moment.utc(moment(endTimeval, "HH:mm:ss")
                        .diff(moment(startTimeval, "HH:mm:ss"))).format("HH:mm:ss")
                    var hDur = newDTData[4].A_hd.trim();
                    for (const [i, dtVal] of jarA.entries()) {

                        // var endTmSS = moment(startTime, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                        // var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                        // var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                        const insertDetailObj = {
                            str_tableName: ProductType.productType == 2 ? 'tbl_cap_detail6' : 'tbl_tab_detail13',
                            data: [
                                { str_colName: 'RepSerNo', value: lastInsertedID },
                                { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : 0 },
                                { str_colName: 'RecSeqNo', value: i + 1 },
                                { str_colName: 'DT_Side', value: 'LHS' },
                                { str_colName: 'DT_BasketID', value: 0 },
                                { str_colName: 'DT_Temp', value: 0 },
                                { str_colName: 'DT_StartTm', value: startTime },
                                { str_colName: 'DT_EndTm', value: endTime },
                                { str_colName: 'DT_TimeMinSec', value: 0 },
                                // { str_colName: 'DT_RunTime', value: runTime },
                                { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                { str_colName: 'DT_Remark', value: 0 },
                                { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                { str_colName: 'DT_HaltDur', value: hDur }
                            ]
                        }
                        //console.log(insertDetailObj);
                        var jarARes = await database.save(insertDetailObj);
                    }
                    var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                    var returnBatchRes = await objBatchSummary.saveBatchSummaryDT(lastInsertedID, 0, productObj, IdsNo);
                    var objUpdateValidation = {
                        str_tableName: "tbl_cubical",
                        data: [
                            { str_colName: 'Sys_Validation', value: 0 },
                        ],
                        condition: [
                            { str_colName: 'Sys_IDSNo', value: IdsNo },
                        ]
                    }
                    await database.update(objUpdateValidation);
                    le = `${protocolIncomingType}` + `R1`;
                    var tempFlagAJar = false; // For time
                    var tempFlagTemp = false // for Tempreture
                    for (const [i, dtVal] of jarA.entries()) {
                        if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                            // return le = `${protocolIncomingType}` + `R2`;
                            tempFlagAJar = true;
                        }
                    }
                    // if ((parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[2].A_tempMin)) ||
                    //     (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[3].A_tempMax))) {
                    //     tempFlagTemp = true;
                    // }
                    if (tempFlagAJar == true) {
                        le = `${protocolIncomingType}` + `R2`;
                    }
                    var objActivity = {};
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'DT Weighment Completed on IDS' + IdsNo });
                    objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                    objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', 'DT', 'completed');
                    //empty object when data is completly saved 

                    var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                    if (tempTDObj == undefined) {
                        globalData.arrDTData.push({
                            idsNo: IdsNo, arr_heading: [],
                            arr_reading: [], arr_info: [],
                            rotaryType: undefined,
                            basketType: undefined,
                            Bath_Temp: undefined


                        })
                    } else {
                        tempTDObj.arr_heading = [];
                        tempTDObj.arr_reading = [];
                        tempTDObj.arr_info = [];
                        tempTDObj.rotaryType = undefined;
                        tempTDObj.basketType = undefined;
                        tempTDObj.Bath_Temp = undefined;
                    }

                    // let JARType = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                    // if (JARType == undefined) {
                    //     globalData.arrJARTypeDT.push({ idsNo: idsNo, JarType: undefined })
                    // }
                    // else {
                    //     JARType.JarType = undefined
                    // }

                    if (globalData.arrJARTypeDT != null) {
                        globalData.arrJARTypeDT = globalData.arrJARTypeDT.filter(k => k.idsNo != IdsNo)
                    }
                    return le;

                } else {
                    console.log('REPEAT_COUNT FOR TDHD000');
                    return '+';
                }
            }
        } catch (err) {
            var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
            let obJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
            if (tempTDObj == undefined) {
                globalData.arrDTData.push({
                    idsNo: idsNo, arr_heading: [], arr_reading: [],
                    arr_info: [],
                    rotaryType: undefined,
                    basketType: undefined,
                    Bath_Temp: undefined,
                })
            } else {
                tempTDObj.arr_heading = [];
                tempTDObj.arr_reading = [];
                tempTDObj.arr_info = [];
                tempTDObj.rotaryType = undefined;
                tempTDObj.basketType = undefined;
                tempTDObj.Bath_Temp = undefined;
            }

            if (globalData.arrJARTypeDT != null) {
                globalData.arrJARTypeDT = globalData.arrJARTypeDT.filter(k => k.idsNo != strIdsNo)
            }

            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log(err);
            throw new Error(err);
        }
    }
    /**
    * @description Dt Data come here
    * @param {*} IdsNo holds current `ids number`
    * @param {*} protocol incoming protocol
    * @returns Promise <> response to `ids`
    */
    async insertBulkWeighmentDTLabIndia(IdsNo, protocol) {
        try {
            var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var currentCubicleObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var actualProtocol = protocol;
            actualProtocol = actualProtocol.match(new RegExp("Ã", "g")) ? actualProtocol.replace(/Ã/g, 'ø') : actualProtocol;
            // actualProtocol = actualProtocol.replace(/[^ -~]+/g, "ø");

            var tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var tdValue = actualProtocol.substring(0, 5);
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var objArrLimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
            var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo);


            var protocolIncomingType = tdValue.substring(0, 1);//Check incoming Protocol is from "T" or "H"
            if (tdValue != "TD000" && tdValue != "HD000" && tdValue != "ED000") {
                /**
                * @description We are here setting TD000 and HD000 to false
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }
                /************************************************************* */
                var bulkDataFlag = globalData.arrBulkDataFlag.find(k => k.IdsNo == IdsNo);
                var tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);

                var jarType = "A";
                var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                if (objJARTypeDT != undefined) {
                    if (objJARTypeDT.JarType == "A") {
                        jarType = "A";
                    }
                    else {
                        jarType = "B";
                    }
                }
                if (actualProtocol.includes('Run Date & Time')) {

                    var objActivity = {};
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'DT Weighment Started on IDS' + IdsNo });
                    objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                    // Instrument usage for DT start
                    objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', 'DT', 'started');

                    const objBulkInvalid = new bulkInvalid();
                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                    objBulkInvalid.invalidObj.DT.invalid = false;
                    objBulkInvalid.invalidObj.DT.invalidMsg = "";
                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                }

                if (actualProtocol.includes('Run Date & Time')) {
                    var startTime = actualProtocol;
                    startTime = `${startTime.split(' ')[7].trim()}:00`;
                    var str_startDate = actualProtocol.split(' ')[5].trim();
                    if (!moment(startTime, TimeFormat, true).isValid()) {
                        const objBulkInvalid = new bulkInvalid();
                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                        objBulkInvalid.invalidObj.DT.invalid = true;
                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,START TIME,IS NOT VALID";
                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                    }
                    var stObj = { "A_st": startTime, "B_st": startTime };
                    //globalData.arrDTData.push(stObj);
                    tempDTObj.arr_heading.push(stObj);
                    var etObj = { "A_et": '00:00:00', "B_et": '00:00:00' };
                    //globalData.arrDTData.push(etObj);
                    tempDTObj.arr_heading.push(etObj);
                    var hdObj = { "A_hd": '00:00:00', "B_hd": '00:00:00' };
                    //globalData.arrDTData.push(hdObj);
                    tempDTObj.arr_heading.push(hdObj);
                    var stDateObj = { "A_startDate": str_startDate, "B_startDate": str_startDate };
                    //globalData.arrDTData.push(stObj);
                    tempDTObj.arr_info.push(stDateObj);
                }
                if (actualProtocol.includes("BASKET RACK")) {
                    var countTotal = (actualProtocol.match(new RegExp("BASKET RACK", "g")) || []).length;
                    if (countTotal == 1) { // For Single rotory
                        var basketType = actualProtocol.split('BASKET RACK ')[1].split(' ')[0];
                        // var basketTypeObj = globalData.arrDTLABIndiaBasketTyep.find(k => k.idsNo == IdsNo);
                        // if (basketTypeObj == undefined) {
                        //     globalData.arrDTLABIndiaBasketTyep.push({ idsNo: IdsNo, basket: basketType })
                        // } else {
                        //     basketTypeObj.basket = basketType;
                        // }


                        //----------------------------------------------------
                        var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                        if (objJARTypeDT == undefined) {
                            globalData.arrJARTypeDT.push({ idsNo: IdsNo, JarType: basketType })
                        } else {
                            objJARTypeDT.JarType = basketType;
                        }
                        //----------------------------------------------------

                    }

                };
                if (actualProtocol.includes('00:00:00')) {
                    bulkDataFlag.flgDTFlag = true;
                }
                if (bulkDataFlag.flgDTFlag == true) {
                    var basketTypeObj = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                    if (actualProtocol.includes("00:00:00") && (actualProtocol.match(new RegExp("ø", "g")) || []).length == 2) {
                        var tempMinValA;
                        var tempMinValB
                        tempMinValA = actualProtocol.split('ø')[0].split(' ')[actualProtocol.split('ø')[0].split(' ').length - 1].trim();
                        tempMinValB = actualProtocol.split('ø')[1].split(' ')[actualProtocol.split('ø')[1].split(' ').length - 1].trim();
                        var tempMinObj = { "A_tempMin": tempMinValA, "B_tempMin": tempMinValB };
                        tempDTObj.arr_heading.push(tempMinObj);
                        bulkDataFlag.flgDTFlag = false;
                    } else if (basketTypeObj.JarType == 'A' && (actualProtocol.match(new RegExp("ø", "g")) || []).length == 1) {
                        var tempMinValA;
                        var tempMinValB
                        tempMinValA = actualProtocol.split('ø')[0].split(' ')[actualProtocol.split('ø')[0].split(' ').length - 1].trim();
                        tempMinValB = 0;
                        var tempMinObj = { "A_tempMin": tempMinValA, "B_tempMin": tempMinValB };
                        tempDTObj.arr_heading.push(tempMinObj);
                        bulkDataFlag.flgDTFlag = false;
                    } else if (basketTypeObj.JarType == 'B' && ((actualProtocol.match(new RegExp("ø", "g")) || []).length == 1 || (actualProtocol.match(new RegExp("Ã", "g")) || []).length == 1)) {
                        var tempMinValA;
                        var tempMinValB
                        tempMinValA = 0
                        tempMinValB = actualProtocol.split('ø')[0].split(' ')[actualProtocol.split('ø')[0].split(' ').length - 1].trim();
                        var tempMinObj = { "A_tempMin": tempMinValA, "B_tempMin": tempMinValB };
                        tempDTObj.arr_heading.push(tempMinObj);
                        bulkDataFlag.flgDTFlag = false;
                    }

                }
                // Now for durations
                var durationVar = actualProtocol.split(' ');
                if (durationVar[0].substr(durationVar[0].length - 2) == '01') {
                    // Maximumn tempreture calculation
                    var basketTypeObj = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                    if ((actualProtocol.match(new RegExp("ø", "g")) || []).length == 2) {
                        var tempMaxValA;
                        var tempMaxValB
                        tempMaxValA = actualProtocol.split('ø')[0].split(' ')[actualProtocol.split('ø')[0].split(' ').length - 1].trim();
                        tempMaxValB = actualProtocol.split('ø')[1].split(' ')[actualProtocol.split('ø')[1].split(' ').length - 1].trim();
                        var tempMaxObj = { "A_tempMax": tempMaxValA, "B_tempMax": tempMaxValB };
                        tempDTObj.arr_heading.push(tempMaxObj);
                    } else if (basketTypeObj.JarType == 'A' && (actualProtocol.match(new RegExp("ø", "g")) || []).length == 1) {
                        var tempMaxValA;
                        var tempMaxValB
                        tempMaxValA = actualProtocol.split('ø')[0].split(' ')[actualProtocol.split('ø')[0].split(' ').length - 1].trim();
                        tempMaxValB = 0;
                        var tempMaxObj = { "A_tempMax": tempMaxValA, "B_tempMax": tempMaxValB };
                        tempDTObj.arr_heading.push(tempMaxObj);
                    } else if (basketTypeObj.JarType == 'B' && (actualProtocol.match(new RegExp("ø", "g")) || []).length == 1) {
                        var tempMaxValA;
                        var tempMinValB
                        tempMaxValA = 0
                        tempMinValB = actualProtocol.split('ø')[0].split(' ')[actualProtocol.split('ø')[0].split(' ').length - 1].trim();
                        var tempMaxObj = { "A_tempMax": tempMaxValA, "B_tempMax": tempMinValB };
                        tempDTObj.arr_heading.push(tempMaxObj);
                    }
                    await this.PushDurWtForLabIndia(actualProtocol, jarType, IdsNo);
                }
                if (durationVar[0].substr(durationVar[0].length - 2) == '02') {
                    await this.PushDurWtForLabIndia(actualProtocol, jarType, IdsNo);
                }
                if (durationVar[0].substr(durationVar[0].length - 2) == '03') {
                    await this.PushDurWtForLabIndia(actualProtocol, jarType, IdsNo);
                }
                if (durationVar[0].substr(durationVar[0].length - 2) == '04') {
                    await this.PushDurWtForLabIndia(actualProtocol, jarType, IdsNo);
                }
                if (durationVar[0].substr(durationVar[0].length - 2) == '05') {
                    await this.PushDurWtForLabIndia(actualProtocol, jarType, IdsNo);
                }
                if (durationVar[0].substr(durationVar[0].length - 2) == '06') {
                    await this.PushDurWtForLabIndia(actualProtocol, jarType, IdsNo);
                }

                return tdValue;

            } else {
                /**
                * @description We are here setting TD000 and HD000 to true
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                var limits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                console.log(tempTDHD)
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
                    var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);

                    const checkData = {
                        //str_tableName: 'tbl_tab_master13',
                        str_tableName: ProductType.productType == 2 ? 'tbl_cap_master6' : 'tbl_tab_master13',
                        data: 'MAX(MstSerNo) AS MstSerNo',
                        condition: [
                            { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                            { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                            { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                            { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                            { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                            { str_colName: 'Idsno', value: IdsNo, comp: 'eq' },
                            { str_colName: 'CubicleType', value: cubicalObj.Sys_CubType, comp: 'eq' },//added by vivek on 03/04/2020
                            { str_colName: 'RepoLabel10', value: cubicalObj.Sys_IPQCType, comp: 'eq' },//added by vivek on 03/04/2020
                        ]
                    }

                    var objcheckData = await database.select(checkData)
                    if (objcheckData[0].length > 0) {
                        if (objcheckData[0][0].MstSerNo == null) {
                            var MstDTSerNo = 1
                        }
                        else {
                            var MstDTSerNo = objcheckData[0][0].MstSerNo + 1
                        }
                    }

                    var arrDTmstSerNo = globalData.arrDTmstSerNo.find(k => k.idsNo == k.idsNo);
                    if (arrDTmstSerNo == undefined) {
                        globalData.arrDTmstSerNo.push({ idsNo: IdsNo, MstDTSerNo: MstDTSerNo })
                    } else {
                        arrDTmstSerNo.MstSerNo = MstDTSerNo;
                    }


                    var jarA = [], jarB = [];
                    var newArrayReading = tempTDObj.arr_reading;
                    for (let i = 0; i < newArrayReading.length; i++) {
                        jarA.push(newArrayReading[i].A);
                        jarB.push(newArrayReading[i].B);
                    }

                    if (productObj.Sys_RotaryType == 'Single') {

                        var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                        if (objJARTypeDT.JarType == "A") {
                            // jarType = "A";
                            for (let i = 0; i < jarA.length; i++) {
                                if (!objInvalid.DT.invalid) {
                                    if (!moment(jarA[i], TimeFormat, true).isValid()) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A DUR,IS NOT VALID";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                            }

                        }
                        else {
                            for (let i = 0; i < jarB.length; i++) {
                                if (!objInvalid.DT.invalid) {
                                    if (!moment(jarB[i], TimeFormat, true).isValid()) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B DUR,IS NOT VALID";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                            }
                        }
                    } else {
                        // for Double
                        for (let i = 0; i < jarA.length; i++) {
                            if (!objInvalid.DT.invalid) {
                                if (!moment(jarA[i], TimeFormat, true).isValid()) {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.DT.invalid = true;
                                    objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR A DUR,IS NOT VALID";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                            }
                        }
                        if (!objInvalid.DT.invalid) {
                            for (let i = 0; i < jarB.length; i++) {
                                if (!objInvalid.DT.invalid) {
                                    if (!moment(jarB[i], TimeFormat, true).isValid()) {
                                        const objBulkInvalid = new bulkInvalid();
                                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                                        objBulkInvalid.invalidObj.DT.invalid = true;
                                        objBulkInvalid.invalidObj.DT.invalidMsg = "REPORT NOT SAVED,JAR B DUR,IS NOT VALID";
                                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                    }
                                }
                            }
                        }
                    }

                    if (objInvalid != undefined && objInvalid.DT.invalid == true) {
                        /**
                         * @description HERE WE MUST EMPTY `arr_heading` AND `arr_reading` after invalid data
                         * because array may contain invalid data
                         */
                        var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
                        logError = logError + objInvalid.DT.invalidMsg;
                        //commented by vivek on 31-07-2020*********************************** */
                        //ErrorLog.error(logError);
                        ErrorLog.addToErrorLog(logError);
                        //******************************************************************* */
                        if (tempTDObj == undefined) {
                            globalData.arrDTData.push({ idsNo: idsNo, arr_heading: [], arr_reading: [], arr_info: [] })
                        } else {
                            tempTDObj.arr_heading = [];
                            tempTDObj.arr_reading = [];
                            tempTDObj.arr_info = [];
                        }
                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'DT', flag: 'ABORTED' } });

                        return `${protocolIncomingType}R40Invalid String,,,,`
                        //return `${protocolIncomingType}R40INVALID DATA,RECEIVED,RETRANSMIT DATA,,`
                    } else {
                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'DT', flag: 'COMPLETED' } });
                        let now = new Date();
                        var tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                        var newDTData = tempDTObj.arr_heading;
                        var newArrayReading = tempDTObj.arr_reading;
                        var newArrayInfo = tempTDObj.arr_info;
                        var startDate = newArrayInfo[0].A_startDate;
                        startDate = startDate.split("/").reverse().join("-");
                        if (startDate.split('-')[0].length == 2) {
                            let year = '20' + startDate.split('-')[0];
                            startDate = year + '-' + startDate.split('-')[1] + '-' + startDate.split('-')[2];
                        }
                        //var newArrayReading = newDTReading.slice(0, -1);//to remove undefine from array
                        var checkType = protocol.split(',');
                        var responseType = checkType[3].split("");
                        var actualResponseType = responseType[0];

                        var jarA = [], jarB = [];
                        let jarATemp = [], jarBTemp = [];
                        if (newDTData.length != 0) {
                            for (let i = 0; i < newArrayReading.length; i++) {
                                jarA.push(newArrayReading[i].A);
                                jarB.push(newArrayReading[i].B);
                                jarATemp.push(newArrayReading[i].tempA);
                                jarBTemp.push(newArrayReading[i].tempB);
                            }
                            var jarType;
                            // == 
                            var timeStatus; // 
                            var endDate;
                            var startTime;
                            var endTime;
                            if (productObj.Sys_RotaryType == 'Single') {
                                var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                                if (objJARTypeDT.JarType == "A") {
                                    jarType = "A";
                                    var sortedJarA = jarA.sort((a, b) => a.localeCompare(b));
                                    startTime = newDTData[0].A_st;
                                    endTime = sortedJarA[sortedJarA.length - 1];
                                    endTime = await this.addTwoTimes(startTime, endTime);
                                    var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                    var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                    endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                                }
                                else {
                                    jarType = "B";
                                    var sortedJarB = jarB.sort((a, b) => a.localeCompare(b));
                                    startTime = newDTData[0].B_st;
                                    endTime = sortedJarB[sortedJarB.length - 1];
                                    endTime = await this.addTwoTimes(startTime, endTime);
                                    var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                    var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                    endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                                }
                            } else {
                                var sortedJarA = jarA.sort((a, b) => a.localeCompare(b));
                                startTime = newDTData[0].A_st;
                                endTime = sortedJarA[sortedJarA.length - 1];
                                endTime = await this.addTwoTimes(startTime, endTime);
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');

                            }

                            var le, actualRunTime;
                            var res = await objProduct.productData(productObj, 'tbl_product_capsule');

                            actualRunTime = ProductType.productType == 2 ? res[1].Param6_Nom : res[1].Param13_Nom;
                            var masterCompleteData = {
                                str_tableName: ProductType.productType == 2 ? 'tbl_cap_master6' : 'tbl_tab_master13',
                                data: [
                                    //as per discussion with pushkar we have to insert 1 as masterserno for MLV
                                    { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : MstDTSerNo },
                                    { str_colName: 'InstruId', value: 1 },
                                    { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                    { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                    { str_colName: 'ProductType', value: ProductType.productType },
                                    { str_colName: 'Qty', value: jarA.length },
                                    { str_colName: 'Idsno', value: IdsNo },
                                    { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                    { str_colName: 'BalanceId', value: currentCubicleObj.Sys_BalID },
                                    { str_colName: 'VernierId', value: currentCubicleObj.Sys_VernierID },
                                    { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                    { str_colName: 'UserId', value: tempUserObject.UserId },
                                    { str_colName: 'UserName', value: tempUserObject.UserName },
                                    { str_colName: 'PrDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : startDate },
                                    { str_colName: 'PrTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : startTime },
                                    { str_colName: 'PrEndDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : endDate },
                                    { str_colName: 'PrEndTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : endTime },
                                    { str_colName: 'Side', value: productObj.Sys_RotaryType == 'Single' ? (jarType == "A") ? "NA" : "NA" : "LHS" },
                                    { str_colName: 'WgmtModeNo', value: 13 },
                                    //{ str_colName: 'Nom', value: res[1].Param13_Nom },
                                    { str_colName: 'Nom', value: ProductType.productType == 2 ? res[1].Param6_Nom : res[1].Param13_Nom },
                                    { str_colName: 'T1NegTol', value: ProductType.productType == 2 ? res[1].Param6_T1Neg : res[1].Param13_T1Neg },
                                    { str_colName: 'T1PosTol', value: ProductType.productType == 2 ? res[1].Param6_T1Pos : res[1].Param13_T1Pos },
                                    { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                    { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                    { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                    { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                    { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                    { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                    { str_colName: 'RepoLabel10', value: cubicalObj.Sys_IPQCType }, // added by vivek on 03-04-2020
                                    { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                    { str_colName: 'RepoLabel11', value: currentCubicleObj.Sys_Validation },
                                    { str_colName: 'PrintNo', value: 0 },
                                    { str_colName: 'IsArchived', value: 0 },
                                    { str_colName: 'GraphType', value: 0 },
                                    { str_colName: 'BatchComplete', value: 0 },
                                    { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                    { str_colName: 'Version', value: productObj.Sys_Version },
                                    { str_colName: 'DTID', value: currentCubicleObj.Sys_DTID },
                                    { str_colName: 'Media', value: productObj.Sys_media },
                                    { str_colName: 'Lot', value: objLotData.LotNo },
                                    { str_colName: 'Area', value: productObj.Sys_Area },
                                    { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                    { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                    { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                    { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                    { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                                ]
                            }
                            if (jarType == "A") {
                                masterCompleteData.data.push(
                                    { str_colName: 'MinTemp', value: newDTData[3].A_tempMin },
                                    { str_colName: 'MaxTemp', value: newDTData[4].A_tempMax },
                                    { str_colName: 'DT_Jar', value: 'A' },
                                );
                            }
                            else if (jarType == "B") {
                                masterCompleteData.data.push(
                                    { str_colName: 'MinTemp', value: newDTData[3].B_tempMin },
                                    { str_colName: 'MaxTemp', value: newDTData[4].B_tempMax },
                                    { str_colName: 'DT_Jar', value: 'B' },
                                );
                            }
                            else {
                                masterCompleteData.data.push(
                                    { str_colName: 'MinTemp', value: newDTData[3].A_tempMin },
                                    { str_colName: 'MaxTemp', value: newDTData[4].A_tempMax },
                                    { str_colName: 'DT_Jar', value: 'A' },
                                );
                            }
                            var resultCompleteData = await database.save(masterCompleteData);
                            var lastInsertedID = resultCompleteData[0].insertId;
                            if (jarType == "A") {
                                var startTime = newDTData[0].A_st.trim();
                                var endTime = newDTData[1].A_et.trim();
                                var startTimeval = moment(startTime, 'HH:mm:ss');
                                var endTimeval = moment(endTime, 'HH:mm:ss');
                                var runTime = moment.utc(moment(endTimeval, "HH:mm:ss")
                                    .diff(moment(startTimeval, "HH:mm:ss"))).format("HH:mm:ss")
                                var hDur = newDTData[2].A_hd.trim();

                                for (const [i, dtVal] of jarA.entries()) {

                                    var endTmSS = moment(startTime, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObj = {
                                        //str_tableName: 'tbl_tab_detail13',
                                        str_tableName: ProductType.productType == 2 ? 'tbl_cap_detail6' : 'tbl_tab_detail13',
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedID },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : MstDTSerNo },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: jarType == "A" ? "LHS" : "RHS" },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            { str_colName: 'DT_Temp', value: jarATemp[i] },
                                            { str_colName: 'DT_StartTm', value: startTime },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            // { str_colName: 'DT_RunTime', value: runTime },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDur }
                                        ]
                                    }
                                    //console.log(insertDetailObj);
                                    var jarARes = await database.save(insertDetailObj);
                                }


                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {

                                    var returnBatchRes = await objBatchSummary.saveBatchSummaryDT(lastInsertedID, 0, productObj, IdsNo);

                                } var objUpdateValidation = {
                                    str_tableName: "tbl_cubical",
                                    data: [
                                        { str_colName: 'Sys_Validation', value: 0 },
                                    ],
                                    condition: [
                                        { str_colName: 'Sys_IDSNo', value: IdsNo },
                                    ]
                                }
                                await database.update(objUpdateValidation);
                                // //Online printing code of Jar B 
                                // const objIOnlinePrint = new IOnlinePrint();
                                // objIOnlinePrint.RepSerNo = lastInsertedID;
                                // objIOnlinePrint.reportOption = "Disintegration Tester";
                                // objIOnlinePrint.testType = "Regular";
                                // objIOnlinePrint.userId = tempUserObject.UserId;
                                // objIOnlinePrint.username = tempUserObject.UserName;
                                // objIOnlinePrint.idsNo = IdsNo
                                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

                                // await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
                                le = `${protocolIncomingType}` + `R1`;
                                var tempFlagAJar = false; // For time
                                var tempFlagTemp = false // for Tempreture
                                for (const [i, dtVal] of jarA.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        // return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }
                                if ((parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].A_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].A_tempMax))) {
                                    tempFlagTemp = true;
                                }
                                // Compare time and temp
                                // if(tempFlagTemp==true || tempFlagAJar==true){
                                //     le = `${protocolIncomingType}` + `R2`;
                                // }
                                // Compare with time for mlveer
                                if (tempFlagAJar == true) {
                                    le = `${protocolIncomingType}` + `R2`;
                                }
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'DT Weighment Completed on IDS' + IdsNo });
                                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                                objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', 'DT', 'completed');
                                //empty object when data is completly saved 
                                var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                                if (tempTDObj == undefined) {
                                    globalData.arrDTData.push({ idsNo: IdsNo, arr_heading: [], arr_reading: [], arr_info: [] })
                                } else {
                                    tempTDObj.arr_heading = [];
                                    tempTDObj.arr_reading = [];
                                    tempTDObj.arr_info = [];
                                }
                                return le;

                            }
                            else if (jarType == "B") {
                                var startTime = newDTData[0].B_st.trim();
                                var endTime = newDTData[1].B_et.trim();
                                var startTimeval = moment(startTime, 'HH:mm:ss');
                                var endTimeval = moment(endTime, 'HH:mm:ss');
                                var runTime = moment.utc(moment(endTimeval, "HH:mm:ss")
                                    .diff(moment(startTimeval, "HH:mm:ss"))).format("HH:mm:ss")
                                var hDur = newDTData[2].B_hd.trim();

                                for (const [i, dtVal] of jarB.entries()) {

                                    var endTmSS = moment(startTime, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObj = {
                                        //str_tableName: 'tbl_tab_detail13',
                                        str_tableName: ProductType.productType == 2 ? 'tbl_cap_detail6' : 'tbl_tab_detail13',
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedID },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : MstDTSerNo },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: jarType == "A" ? "LHS" : "RHS" },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            { str_colName: 'DT_Temp', value: jarBTemp[i] },
                                            { str_colName: 'DT_StartTm', value: startTime },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDur }
                                        ]
                                    }

                                    var jarBRes = await database.save(insertDetailObj);


                                }

                                var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {

                                    var returnBatchRes = await objBatchSummary.saveBatchSummaryDT(lastInsertedID, 0, productObj, IdsNo);

                                } var objUpdateValidation = {
                                    str_tableName: "tbl_cubical",
                                    data: [
                                        { str_colName: 'Sys_Validation', value: 0 },
                                    ],
                                    condition: [
                                        { str_colName: 'Sys_IDSNo', value: IdsNo },
                                    ]
                                }
                                await database.update(objUpdateValidation);
                                //Online printing code of Jar B 
                                // const objIOnlinePrint = new IOnlinePrint();
                                // objIOnlinePrint.RepSerNo = lastInsertedID;
                                // objIOnlinePrint.reportOption = "Disintegration Tester";
                                // objIOnlinePrint.testType = "Regular";
                                // objIOnlinePrint.userId = tempUserObject.UserId;
                                // objIOnlinePrint.username = tempUserObject.UserName;
                                // objIOnlinePrint.idsNo = IdsNo
                                // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

                                // await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'DT Weighment Completed on IDS' + IdsNo });
                                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                                objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', 'DT', 'completed');
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;


                                le = `${protocolIncomingType}` + `R1`;
                                var tempFlagAJar = false; // For time
                                var tempFlagTemp = false // for Tempreture
                                for (const [i, dtVal] of jarB.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        //return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }
                                if ((parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].B_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].B_tempMax))) {
                                    tempFlagTemp = true;
                                }
                                // Compare time and temp
                                // if(tempFlagTemp==true || tempFlagAJar==true){
                                //     le = `${protocolIncomingType}` + `R2`;
                                // }
                                //compare with time
                                if (tempFlagAJar == true) {
                                    le = `${protocolIncomingType}` + `R2`;
                                }
                                //empty object when data is completly saved 
                                var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                                if (tempTDObj == undefined) {
                                    globalData.arrDTData.push({ idsNo: IdsNo, arr_heading: [], arr_reading: [], arr_info: [] })
                                } else {
                                    tempTDObj.arr_heading = [];
                                    tempTDObj.arr_reading = [];
                                    tempTDObj.arr_info = [];
                                }
                                return le;

                            }
                            else {

                                // var objJARTypeDT = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
                                // if (objJARTypeDT.JarType == "A") {
                                //     jarType = "A";
                                // }
                                // else {
                                //     jarType = "B";
                                // }

                                var startTimeA = newDTData[0].A_st.trim();
                                var endTimeA = newDTData[1].A_et.trim();
                                var startTimevalA = moment(startTimeA, 'HH:mm:ss');
                                var endTimevalA = moment(endTimeA, 'HH:mm:ss');
                                var runTimeA = moment.utc(moment(endTimevalA, "HH:mm:ss")
                                    .diff(moment(startTimevalA, "HH:mm:ss"))).format("HH:mm:ss")
                                var hDurA = newDTData[2].A_hd.trim();

                                var startTimeB = newDTData[0].B_st.trim();
                                var endTimeB = newDTData[1].B_et.trim();
                                var startTimevalB = moment(startTimeB, 'HH:mm:ss');
                                var endTimevalB = moment(endTimeB, 'HH:mm:ss');
                                var runTimeB = moment.utc(moment(endTimevalB, "HH:mm:ss")
                                    .diff(moment(startTimevalB, "HH:mm:ss"))).format("HH:mm:ss");
                                var hDurB = newDTData[2].B_hd.trim();



                                for (const [i, dtVal] of jarA.entries()) {
                                    var endTmSS = moment(startTimeA, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObjA = {
                                        //str_tableName : 'tbl_tab_detail13',
                                        str_tableName: ProductType.productType == 2 ? 'tbl_cap_detail6' : 'tbl_tab_detail13',
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedID },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : MstDTSerNo },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: 'LHS' },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            { str_colName: 'DT_Temp', value: jarATemp[i] },
                                            { str_colName: 'DT_StartTm', value: startTimeA },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            //{ str_colName: 'DT_RunTime', value: runTimeA },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDurA }
                                        ]
                                    }
                                    var ResJarA = await database.save(insertDetailObjA);

                                }
                                //Online printing code of Jar A 
                                // const objIOnlinePrintA = new IOnlinePrint();
                                // objIOnlinePrintA.RepSerNo = lastInsertedID;
                                // objIOnlinePrintA.reportOption = "Disintegration Tester";
                                // objIOnlinePrintA.testType = "Regular";
                                // objIOnlinePrintA.userId = tempUserObject.UserId;
                                // objIOnlinePrintA.username = tempUserObject.UserName;
                                // objIOnlinePrintA.idsNo = IdsNo
                                // const objPrinterNameA = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                // const a = await objPrintReport.generateOnlineReportAsync(objIOnlinePrintA, objPrinterNameA.Sys_PrinterName)
                                /* inserting Data of double rotatry for B*/
                                var sortedJarB = jarB.sort((a, b) => a.localeCompare(b));
                                startTime = newDTData[0].B_st;
                                endTime = sortedJarB[sortedJarB.length - 1];
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                var timeStatus = (parseInt(endTime.replace(regExp, "$1$2$3")) > parseInt(startTime.replace(regExp, "$1$2$3")))
                                endDate = timeStatus ? startDate : date.format(now, 'YYYY-MM-DD');
                                endTime = await this.addTwoTimes(startTime, endTime);
                                var masterCompleteDataJarB = {
                                    //str_tableName: 'tbl_tab_master13',
                                    str_tableName: ProductType.productType == 2 ? 'tbl_cap_master6' : 'tbl_tab_master13',
                                    data: [
                                        { str_colName: 'InstruId', value: 1 },
                                        { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : MstDTSerNo },
                                        { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                        { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                        { str_colName: 'ProductType', value: ProductType.productType },
                                        { str_colName: 'Qty', value: jarB.length },
                                        { str_colName: 'Idsno', value: IdsNo },
                                        { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                        { str_colName: 'BalanceId', value: currentCubicleObj.Sys_BalID },
                                        { str_colName: 'VernierId', value: currentCubicleObj.Sys_VernierID },
                                        { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                        { str_colName: 'UserId', value: tempUserObject.UserId },
                                        { str_colName: 'UserName', value: tempUserObject.UserName },
                                        { str_colName: 'PrDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : startDate },
                                        { str_colName: 'PrTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : startTime },
                                        { str_colName: 'PrEndDate', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'YYYY-MM-DD') : endDate },
                                        { str_colName: 'PrEndTime', value: serverConfig.DTDateandTime == 'now' ? date.format(now, 'HH:mm:ss') : endTime },
                                        { str_colName: 'Side', value: 'RHS' },
                                        { str_colName: 'WgmtModeNo', value: 13 },
                                        { str_colName: 'Nom', value: ProductType.productType == 1 ? res[1].Param13_Nom : res[1].Param6_Nom },
                                        { str_colName: 'T1NegTol', value: ProductType.productType == 1 ? res[1].Param13_T1Neg : res[1].Param6_T1Neg },
                                        { str_colName: 'T1PosTol', value: ProductType.productType == 1 ? res[1].Param13_T1Pos : res[1].Param6_T1Pos },
                                        { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                        { str_colName: 'RepoLabel10', value: cubicalObj.Sys_IPQCType }, // added by vivek on 03-04-2020
                                        { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                        { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                        { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                        { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                        { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                        { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                        { str_colName: 'RepoLabel11', value: currentCubicleObj.Sys_Validation },
                                        { str_colName: 'PrintNo', value: 0 },
                                        { str_colName: 'IsArchived', value: 0 },
                                        { str_colName: 'GraphType', value: 0 },
                                        { str_colName: 'BatchComplete', value: 0 },
                                        { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                        { str_colName: 'Version', value: productObj.Sys_Version },
                                        { str_colName: 'MinTemp', value: newDTData[3].B_tempMin },
                                        { str_colName: 'MaxTemp', value: newDTData[4].B_tempMax },
                                        { str_colName: 'DTID', value: currentCubicleObj.Sys_DTID },
                                        { str_colName: 'Media', value: productObj.Sys_media },
                                        { str_colName: 'Area', value: productObj.Sys_Area },
                                        { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                        { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                        { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                        { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                        { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                                        { str_colName: 'DT_Jar', value: 'B' },
                                    ]
                                }
                                var resultCompleteDataJarB = await database.save(masterCompleteDataJarB);

                                var lastInsertedIDJarB = resultCompleteDataJarB[0].insertId;
                                for (const [i, dtVal] of jarB.entries()) {
                                    var endTmSS = moment(startTimeA, "HH:mm:ss").add(dtVal.trim().split(":")[2], 'seconds').format("HH:mm:ss");
                                    var endTmMM = moment(endTmSS, "HH:mm:ss").add(dtVal.trim().split(":")[1], 'minutes').format("HH:mm:ss");
                                    var endTm = moment(endTmMM, "HH:mm:ss").add(dtVal.trim().split(":")[0], 'hours').format("HH:mm:ss");

                                    const insertDetailObjB = {
                                        //str_tableName: 'tbl_tab_detail13',
                                        str_tableName: ProductType.productType == 2 ? 'tbl_cap_detail6' : 'tbl_tab_detail13',
                                        data: [
                                            { str_colName: 'RepSerNo', value: lastInsertedIDJarB },
                                            { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : MstDTSerNo },
                                            { str_colName: 'RecSeqNo', value: i + 1 },
                                            { str_colName: 'DT_Side', value: 'RHS' },
                                            { str_colName: 'DT_BasketID', value: 0 },
                                            { str_colName: 'DT_Temp', value: jarBTemp[i] },
                                            { str_colName: 'DT_StartTm', value: startTimeB },
                                            { str_colName: 'DT_EndTm', value: endTm },
                                            { str_colName: 'DT_TimeMinSec', value: 0 },
                                            //{ str_colName: 'DT_RunTime', value: runTimeB },
                                            { str_colName: 'DT_RunTime', value: dtVal.trim() },
                                            { str_colName: 'DT_Remark', value: 0 },
                                            { str_colName: 'DT_DoneByID', value: tempUserObject.UserId },
                                            { str_colName: 'DT_DoneByName', value: tempUserObject.UserName },
                                            { str_colName: 'DT_StartDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'DT_HaltDur', value: hDurB }
                                        ]
                                    }

                                    var ResDetailB = await database.save(insertDetailObjB);

                                }
                                /* end of  inserting Data of double rotatry for B*/



                                var objUpdateValidation = {
                                    str_tableName: "tbl_cubical",
                                    data: [
                                        { str_colName: 'Sys_Validation', value: 0 },
                                    ],
                                    condition: [
                                        { str_colName: 'Sys_IDSNo', value: IdsNo },
                                    ]
                                }


                                var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                                if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {

                                    var returnBatchRes = await objBatchSummary.saveBatchSummaryDT(lastInsertedID, lastInsertedIDJarB, productObj, IdsNo);

                                } var resValidation = await database.update(objUpdateValidation);
                                // Activity Log for DT weighmnet Completed
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'DT Weighment Completed on IDS' + IdsNo });
                                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                                // Instrument usage for DT complete
                                objInstrumentUsage.InstrumentUsage('DT', IdsNo, 'tbl_instrumentlog_dt', '', 'completed')




                                //Online printing code of Jar B 


                                //   if (a == true) {
                                // const objIOnlinePrintB = new IOnlinePrint();
                                // objIOnlinePrintB.RepSerNo = lastInsertedIDJarB;
                                // objIOnlinePrintB.reportOption = "Disintegration Tester";
                                // objIOnlinePrintB.testType = "Regular";
                                // objIOnlinePrintB.userId = tempUserObject.UserId;
                                // objIOnlinePrintB.username = tempUserObject.UserName;
                                // objIOnlinePrintB.idsNo = IdsNo
                                // const objPrinterNameB = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);

                                // const b = await objPrintReport.generateOnlineReportAsync(objIOnlinePrintB, objPrinterNameB.Sys_PrinterName);
                                var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
                                // if ((parseInt(actualRunTime.replace(regExp, "$1$2$3")) > parseInt(runTimeA.replace(regExp, "$1$2$3")))
                                //     && (parseInt(actualRunTime.replace(regExp, "$1$2$3")) > parseInt(runTimeB.replace(regExp, "$1$2$3")))) {
                                //     return le = `${protocolIncomingType}` + `R1`;
                                // } else {
                                //     return le = `${protocolIncomingType}` + `R2`;
                                // }
                                //  }

                                le = `${protocolIncomingType}` + `R1`

                                var tempFlagAJar = false; // For time
                                var tempFlagTemp = false // for Tempreture
                                for (const [i, dtVal] of jarA.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        // return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }


                                for (const [i, dtVal] of jarB.entries()) {
                                    if (parseInt(dtVal.trim().replace(regExp, "$1$2$3")) > parseInt(actualRunTime.replace(regExp, "$1$2$3"))) {
                                        // return le = `${protocolIncomingType}` + `R2`;
                                        tempFlagAJar = true;
                                    }
                                }

                                if ((parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].A_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Neg) > parseFloat(newDTData[3].B_tempMin)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].A_tempMax)) ||
                                    (parseFloat(objArrLimits.DT.T1Pos) < parseFloat(newDTData[4].B_tempMax))) {
                                    tempFlagTemp = true;
                                }
                                //Comapre with temp and time
                                // if(tempFlagTemp==true || tempFlagAJar==true){
                                //     le = `${protocolIncomingType}` + `R2`;
                                // }
                                //Comapre with temp and time
                                if (tempFlagAJar == true) {
                                    le = `${protocolIncomingType}` + `R2`;
                                }
                                //empty object when data is completly saved 
                                var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                                if (tempTDObj == undefined) {
                                    globalData.arrDTData.push({ idsNo: idsNo, arr_heading: [], arr_reading: [], arr_info: [] })
                                } else {
                                    tempTDObj.arr_heading = [];
                                    tempTDObj.arr_reading = [];
                                    tempTDObj.arr_info = [];
                                }
                                return le;


                            }
                        }

                    }
                } else {
                    console.log('REPEAT_COUNT FOR TDHD000');
                    return '+';
                }
                //     var tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
                //     console.log('ended',tempDTObj);
                //    var le = `${protocolIncomingType}` + `R1`;
                //     return le;
            }
        } catch (err) {
            var tempTDObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
            if (tempTDObj == undefined) {
                globalData.arrDTData.push({ idsNo: idsNo, arr_heading: [], arr_reading: [], arr_info: [] })
            } else {
                tempTDObj.arr_heading = [];
                tempTDObj.arr_reading = [];
                tempTDObj.arr_info = [];
            }
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log(err);
            throw new Error(err);
        }
    }
    async addTwoTimes(Tm1, Tm2) {
        var a = Tm1.split(":");
        var seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2];
        var b = Tm2.split(":");
        var seconds2 = +b[0] * 60 * 60 + +b[1] * 60 + +b[2];

        var date = new Date(1970, 0, 1);
        date.setSeconds(seconds + seconds2);

        var c = date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
        return c;
    }
    async PushDurWtForLabIndia(actualProtocol, jarType, IdsNo) {
        try {
            actualProtocol = actualProtocol.substring(0, actualProtocol.length - 2)
            var tempDTObj = globalData.arrDTData.find(td => td.idsNo == IdsNo);
            var basketTypeObj = globalData.arrJARTypeDT.find(k => k.idsNo == IdsNo);
            if (((actualProtocol.match(new RegExp("ø", "g")) || actualProtocol.match(new RegExp("Ã", "g"))) || []).length == 2) {
                var countOne = actualProtocol;

                var prefferedPatterns = actualProtocol.split(' ');

                var arrDummy = [];
                var arrTempDummy = [];
                for (let i = 0; i < prefferedPatterns.length; i++) {
                    if (prefferedPatterns[i].match(new RegExp(":", "g"))) {
                        arrDummy.push(prefferedPatterns[i]);
                    }
                    if (prefferedPatterns[i].match(new RegExp("ø", "g")) || prefferedPatterns[i].match(new RegExp("Ã", "g"))) {
                        arrTempDummy.push(prefferedPatterns[i].split('ø')[0].trim());
                    }
                }
                var jarADur = arrDummy[0];
                var jarBDur = arrDummy[1];
                var c1Obj = { "A": jarADur, "B": jarBDur, "tempA": arrTempDummy[0], "tempB": arrTempDummy[1] };
                //globalData.arrDTDataReading.push(c1Obj);
                if (c1Obj.A != undefined && c1Obj.B != undefined) {
                    tempDTObj.arr_reading.push(c1Obj);
                }
            } else if (basketTypeObj.JarType == 'A' && ((actualProtocol.match(new RegExp("ø", "g")) || []).length == 1 || (actualProtocol.match(new RegExp("Ã", "g")) || []).length == 1)) {
                var countOne = actualProtocol;
                var jarADur = actualProtocol.split(' ')[1];
                var jarBDur = 'NA';
                let jarATemp = actualProtocol.split('ø')[0].split(' ');
                jarATemp = jarATemp[jarATemp.length - 1].trim();
                var c1Obj = { "A": jarADur, "B": jarBDur, "tempA": jarATemp, "tempB": 0 };
                //globalData.arrDTDataReading.push(c1Obj);
                if (c1Obj.A != undefined && c1Obj.B != undefined) {
                    tempDTObj.arr_reading.push(c1Obj);
                }
            } else if (basketTypeObj.JarType == 'B' && ((actualProtocol.match(new RegExp("ø", "g")) || []).length == 1 || (actualProtocol.match(new RegExp("Ã", "g")) || []).length == 1)) {
                var countOne = actualProtocol;
                var jarADur = 'NA'
                var jarBDur = actualProtocol.split(' ')[1]
                let jarBTemp = actualProtocol.split('ø')[0].split(' ');
                jarBTemp = jarBTemp[jarBTemp.length - 1].trim();
                var c1Obj = { "A": jarADur, "B": jarBDur, "tempA": 0, "tempB": jarBTemp };
                //globalData.arrDTDataReading.push(c1Obj);
                if (c1Obj.A != undefined && c1Obj.B != undefined) {
                    tempDTObj.arr_reading.push(c1Obj);
                }
            }
            return true;
        } catch (err) {
            throw new Error(err);
        }
    }

    /**
     * @description TDT Data come here(TAP DENSITY TEST REPORT)
     * @param {*} IdsNo holds current `ids number`
     * @param {*} protocol incoming protocol
     * @return Promise <> response to `ids`
     */

    async insertBulkWeighmentTDT(IdsNo, protocol) {
        var actualProtocol = protocol;
        var tdValue = actualProtocol.substring(0, 5);
        const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
        var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
        var selectedIds;
        if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds;
        } else {
            selectedIds = IdsNo;
        }
        var cubicleObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
        var protocolIncomingType = tdValue.substring(0, 1);//here incoming protocol is check T Or H
        var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);


        if (tdValue != "TD000" && tdValue != "HD000" && tdValue != "ED000") {
            /**
            * @description We are here setting TD000 and HD000 to false
            */
            var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
            if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
            else { tempTDHD.flag = false; tempTDHD.oc = 0 }
            /************************************************************* */

            let tempTDObj = globalData.arrTDTData.find(td => td.idsNo == IdsNo);
            var modelNo = actualProtocol.includes("Model No");
            if (modelNo == true) {
                var modelNoVal = actualProtocol.trim();
                var modelNoVal1 = modelNoVal.split(" ");
                var modelNoVal2 = modelNoVal1.indexOf('Model');
                var num1 = modelNoVal2 + 4;
                var num2 = modelNoVal2 + 5;
                var modelActualVal = modelNoVal1[num1] + modelNoVal1[num2];
                var model = { "modelNo": modelActualVal };
                tempTDObj.arr.push(model);
                //globalData.arrTDTData.push(model);
            }

            var version = actualProtocol.includes("Version");
            if (version == true) {
                var v1 = actualProtocol.replace(/ +(?= )/g, '');
                v1 = v1.split(':')[1];
                tempTDObj.version = parseFloat(v1)
            }
            var newstring = false
            if (tempTDObj.version == 5.5) {
                newstring = true
            }

            if (newstring) {
                // according to new string with version 5.5 and make is ETD:1020X 
                if (actualProtocol.includes("V0")) {
                    let V0 = actualProtocol.replace(/ +(?= )/g, '');
                    V0 = V0.split(' ')[3].split("N")[0]

                    let initialValue = { "initialVolume": V0 };
                    tempTDObj.arr.push(initialValue);
                }
                else if (actualProtocol.includes("V1")) {
                    var V1 = actualProtocol.replace(/ +(?= )/g, '');
                    V1 = V1.split(' ')[3].split("N")[0]
                    let tapVol1 = { "tapCountvol1": V1 };
                    let unitval = { "unit": 'ml' };
                    tempTDObj.arr.push(tapVol1);
                    tempTDObj.arr.push(unitval);
                }
                else if (actualProtocol.includes("V2")) {
                    var V2 = actualProtocol.replace(/ +(?= )/g, '');
                    V2 = V2.split(' ')[3].split("N")[0]
                    var tapVol2 = { "tapCountvol2": V2 };
                    tempTDObj.arr.push(tapVol2);
                }
                else if (actualProtocol.includes("V3")) {
                    var V3 = actualProtocol.replace(/ +(?= )/g, '');
                    let version = V3.split(' ')[3].split("N")[0]

                    let tapVol3 = { "tapCountvol3": version };
                    tempTDObj.arr.push(tapVol3);

                    var difference = parseFloat(parseFloat(V3.split(' ')[4]))
                    var diffCountValue = { "diff1": difference };
                    tempTDObj.arr.push(diffCountValue);
                    
                }
                else if (actualProtocol.includes("V4A")) {
                    var V4 = actualProtocol.replace(/ +(?= )/g, '');
                    let version = V4.split(' ')[3].split("N")[0]

                    let tapVol4 = { "add1": version };
                    tempTDObj.arr.push(tapVol4);

                    var difference = parseFloat(parseFloat(V4.split(' ')[4]))
                    var diffCountValue = { "diff2": difference };
                    tempTDObj.arr.push(diffCountValue);
                  
                }
                else if (actualProtocol.includes("V4B")) {
                    var V4b = actualProtocol.replace(/ +(?= )/g, '');
                    let version = V4b.split(' ')[3].split("N")[0]

                    let tapVol4b = { "add2": version };
                    tempTDObj.arr.push(tapVol4b);

                    var difference = parseFloat(parseFloat(V4b.split(' ')[4]))
                    var diffCountValue = { "diff3": difference };
                    tempTDObj.arr.push(diffCountValue);
                    // tempTDObj.version = undefined;
                }

            }


          var testResult = actualProtocol.includes("TEST RESULTS");
          if(testResult ==  true){
            if(newstring ==  true){
                tempTDObj.version = undefined;
            }
          }


            var serialNo = actualProtocol.includes("Serial No");
            if (serialNo == true) {
                var serialNoVal = actualProtocol.trim();
                var serialNoVal1 = serialNoVal.split(" ");
                var indexofSerial = serialNoVal1.indexOf('Serial');
                var indexofInstru = serialNoVal1.indexOf('Inst.ID:');
                var num3 = indexofSerial + 3;
                var num4 = indexofInstru + 1;
                var serialActualVal = serialNoVal1[num3];
                var instrumentVal = serialNoVal1[num4];
                var serial = { "serialNo": serialActualVal };

                if (typeof serial.serialNo != 'number') {
                    serial = { "serialNo": "0" }
                }

                tempTDObj.arr.push(serial);
                //globalData.arrTDTData.push(serial);
                var instruement = { "instruNo": instrumentVal.slice(0, -2) };

                if (typeof instruement.instruNo != 'number') {
                    instruement = { "instruNo": "0" }
                }
                tempTDObj.arr.push(instruement);
                //globalData.arrTDTData.push(instruement);
            }

            var tapCount1 = actualProtocol.includes("Method");
            if (tapCount1 == true) {
                var tapCountA = actualProtocol.split(':');
                if (actualProtocol.includes('Tap Count1')) {
                    var method = tapCountA[1].split('Tap Count1')[0].trim()
                    var tapCount1val = tapCountA[2].trim();
                    var val1 = tapCount1val.replace("N", " ").replace("R", " ").replace("n", " ");
                    var val1Value = val1.split(' ')[0];
                    var Method = { "Method": method }
                    var count1 = { "tapCount1": val1Value };
                    tempTDObj.arr.push(count1, Method);
                    //globalData.arrTDTData.push(count1);
                    // Activity Log for TDT
                    var objActivity = {};
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'Tapped Density Weighment Started on IDS' + IdsNo });
                    objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                    // Instrument usage for TDT started
                    objInstrumentUsage.InstrumentUsage('TDT', IdsNo, 'tbl_instrumentlog_tapdensity', 'TDT', 'started')
                }

            }
            var tapCount2 = actualProtocol.includes("Drops/Min");
            if (tapCount2 == true) {
                var tapCountB = actualProtocol.split(':');
                var tapCount2val = tapCountB[2].trim();
                var val2 = tapCount2val.replace("N", " ").replace("R", " ").replace("n", " ");
                var val2Value = val2.split(' ')[0];
                var count2 = { "tapCount2": val2Value };
                tempTDObj.arr.push(count2);
                //globalData.arrTDTData.push(count2);
            }

            var tapCount3 = actualProtocol.includes("Drop Height");
            if (tapCount3 == true) {
                var tapCountC = actualProtocol.split(':');
                var tapCount3val = tapCountC[2].trim();
                var val3 = tapCount3val.replace("N", " ").replace("R", " ").replace("n", " ");;
                val3.replace("R", " ");
                var val3Value = val3.split(' ')[0];
                var count3 = { "tapCount3": val3Value };
                tempTDObj.arr.push(count3);
                //globalData.arrTDTData.push(count3);
            }

            var tapCount4 = actualProtocol.includes("Cylinder");
            if (tapCount4 == true) {
                var tapCountD = actualProtocol.split(':');
                var tapCount4val = tapCountD[2].trim();
                var val4 = tapCount4val.replace("N", " ").replace("R", " ").replace("n", " ");
                var val4Value = val4.split(' ')[0];
                var count4 = { "tapCount4": val4Value };
                tempTDObj.arr.push(count4);
                //globalData.arrTDTData.push(count4);
            }

            var wtSample = actualProtocol.includes("Weight of sample (W)");
            if (wtSample == true) {
                var sampleWeight = actualProtocol.split(':');
                var sampleValue = sampleWeight[1].trim();
                var sampleWtVal = sampleValue.split(' ')[0];
                let checkInvalid = await this.ISInvalid(sampleWtVal, IdsNo)
                if (!checkInvalid) {

                    var wt = { "wtOfSample": sampleWtVal };
                    tempTDObj.arr.push(wt);
                }
                //globalData.arrTDTData.push(wt);
            }

            var initialVolume = actualProtocol.includes("Initial volume (Vo)");
            if (initialVolume == true) {
                var iniVol = actualProtocol.split(':');
                var volValue = iniVol[1].trim();
                var iniVolVal = volValue.split(' ')[0];
                let checkInvalid = await this.ISInvalid(iniVolVal, IdsNo)
                if (!checkInvalid) {
                    var initialValue = { "initialVolume": iniVolVal };
                    tempTDObj.arr.push(initialValue);
                }


                //globalData.arrTDTData.push(initialValue);
            }

            var tapCountVol1 = actualProtocol.includes("Volume with Tap Count1");
            if (tapCountVol1 == true) {
                var tapCountVolA = actualProtocol.split(':');
                var tapCountVolA1 = tapCountVolA[1].trim();
                if (tapCountVolA1.includes('ml')) {
                    var vol1 = tapCountVolA1.split(' ')[0];
                    var unit = tapCountVolA1.split(' ')[1];
                    var unit1 = unit.split('N');

                    let checkInvalid = await this.ISInvalid(vol1, IdsNo)
                    if (!checkInvalid) {
                        var tapVol1 = { "tapCountvol1": vol1 };
                        tempTDObj.arr.push(tapVol1);
                    }
                    var unitval = { "unit": unit1[0] };
                    tempTDObj.arr.push(unitval);
                }
                //globalData.arrTDTData.push(tapVol1);
                //globalData.arrTDTData.push(unitval);
            }

            var tapCountVol2 = actualProtocol.includes("Volume with Tap Count2");
            if (tapCountVol2 == true) {
                var tapCountVolB = actualProtocol.split(':');
                var tapCountVolB1 = tapCountVolB[1].trim();
                if (tapCountVolB1.includes('ml')) {
                    var vol2 = tapCountVolB1.split(' ')[0];
                    var vol2val = vol2.split('ml');

                    let checkInvalid = await this.ISInvalid(vol2val[0], IdsNo)
                    if (!checkInvalid) {

                        var tapVol2 = { "tapCountvol2": vol2val[0] };
                        tempTDObj.arr.push(tapVol2);
                    }
                }
                //globalData.arrTDTData.push(tapVol2);
            }

            var differenceCount = actualProtocol.includes("Diff.(V2-V3)");
            if (differenceCount == true) {
                var diffCount = actualProtocol.split(':');
                var diffCount1 = diffCount[1].trim();
                var diffCountVal = diffCount1.split(' ')[0];

                let checkInvalid = await this.ISInvalid(diffCountVal, IdsNo)
                if (!checkInvalid) {

                    var diffCountValue = { "diff1": diffCountVal };
                    tempTDObj.arr.push(diffCountValue);
                }
                //globalData.arrTDTData.push(diffCountValue);
            }

            //var tapCountVol3 = actualProtocol.includes("Volume with Tap Count4 (V3a)");
            var tapCountVol3 = actualProtocol.includes("Volume with Tap Count3");
            if (tapCountVol3 == true) {
                var tapCountVolC = actualProtocol.split(':');
                var tapCountVolC1 = tapCountVolC[1].trim();
                if (tapCountVolC1.includes('ml')) {
                    var vol3 = tapCountVolC1.split(' ')[0];
                    var vol3val = vol3.split('ml');

                    let checkInvalid = await this.ISInvalid(vol3val[0], IdsNo)
                    if (!checkInvalid) {
                        var tapVol3 = { "tapCountvol3": vol3val[0] };
                        tempTDObj.arr.push(tapVol3);
                    }
                }
                //globalData.arrTDTData.push(tapVol3);
            }

            var additionalTabCount1 = actualProtocol.includes("Volume with Tap Count4 (V4a)");
            if (additionalTabCount1 == true) {
                var tapCountVolD = actualProtocol.split(':');
                var tapCountVolD1 = tapCountVolD[1].trim();
                if (tapCountVolD1.includes('ml')) {
                    var vol4 = tapCountVolD1.split(' ')[0];
                    //var vol4val = vol4.split('ml');

                    let checkInvalid = await this.ISInvalid(vol4, IdsNo)
                    if (!checkInvalid) {
                        var tapVol4 = { "add1": vol4 };
                        tempTDObj.arr.push(tapVol4);
                    }
                    //globalData.arrTDTData.push(tapVol4);
                }
            }

            var differenceCount1 = actualProtocol.includes("Diff.(V3-V4a)");
            if (differenceCount1 == true) {
                var diffCount2 = actualProtocol.split(':');
                var diffCount12 = diffCount2[1].trim();
                var diffCountVal2 = diffCount12.split(' ')[0];
                var diffCouVal2 = diffCountVal2.split('ml');
                let checkInvalid = await this.ISInvalid(diffCouVal2[0], IdsNo)
                if (!checkInvalid) {
                    var diffCountValue2 = { "diff2": diffCouVal2[0] };
                    tempTDObj.arr.push(diffCountValue2);
                }
                //globalData.arrTDTData.push(diffCountValue2);
            }

            var tapCountVol4 = actualProtocol.includes("Volume with Tap Count4 (V4b)");
            if (tapCountVol4 == true) {
                var tapCountVolD = actualProtocol.split(':');
                var tapCountVolD1 = tapCountVolD[1].trim();
                if (tapCountVolD1.includes('ml')) {
                    var vol4 = tapCountVolD1.split(' ')[0];
                    //var vol4val = vol4.split('ml');
                    let checkInvalid = await this.ISInvalid(vol4, IdsNo)
                    if (!checkInvalid) {
                        var tapVol4 = { "add2": vol4 };
                        tempTDObj.arr.push(tapVol4);
                    }
                }
                //globalData.arrTDTData.push(tapVol4);
            }

            var differenceCount2 = actualProtocol.includes("Diff.(V4a-V4b)");
            if (differenceCount2 == true) {
                var diffCount3 = actualProtocol.split(':');
                var diffCount13 = diffCount3[1].trim();
                var diffCountVal3 = diffCount13.split(' ')[0];
                var diffCouVal3 = diffCountVal3.split('ml');

                let checkInvalid = await this.ISInvalid(diffCouVal3[0], IdsNo)
                if (!checkInvalid) {
                    var diffCountValue3 = { "diff3": diffCouVal3[0] };
                    tempTDObj.arr.push(diffCountValue3);
                }
                //globalData.arrTDTData.push(diffCountValue3);
            }


            var tapDensity = actualProtocol.includes("Tap Density (W/Vf)");
            if (tapDensity == true) {
                var tapDensityVal = actualProtocol.split(':');
                var densityVal = tapDensityVal[1].trim();
                var tabDensValue = densityVal.split(' ')[0];

                let checkInvalid = await this.ISInvalid(tabDensValue, IdsNo)
                if (!checkInvalid) {
                    var tapDensityValue = { "tapDensity": tabDensValue };
                    tempTDObj.arr.push(tapDensityValue);
                }

                //globalData.arrTDTData.push(tapDensityValue);
            }

            var BulkDensity = actualProtocol.includes("Initial Density (W/Vo) ");
            if (BulkDensity == true) {
                var bulkDensityVal = actualProtocol.split(':');
                var b_densityVal = bulkDensityVal[1].trim();
                var bulkDensValue = b_densityVal.split(' ')[0];
                let checkInvalid = await this.ISInvalid(bulkDensValue, IdsNo)
                if (!checkInvalid) {
                    var BulkDensityValue = { "bulkDensity": bulkDensValue };
                    tempTDObj.arr.push(BulkDensityValue);
                }


                //globalData.arrTDTData.push(tapDensityValue);
            }

            //calculating tapdensity 
            // var finalvolume = actualProtocol.includes("Final Volume (Vf)");
            // if (finalvolume == true) {
            //     var finalvolumeProtocol = actualProtocol.split(':');
            //     var final_volume = finalvolumeProtocol[1].trim();
            //     var fv = final_volume.split(' ')[0];
            //     var finalvolumeValue = { "finalVolume": fv };
            //     tempTDObj.arr.push(finalvolumeValue);
            //     //globalData.arrTDTData.push(tapDensityValue);
            // }

            var compressInd = actualProtocol.includes("Compressibility Index");
            if (compressInd == true) {
                var comIndexVal = actualProtocol.split(':');
                var indexVal = comIndexVal[1].trim();
                var indexValue = indexVal.split(' ')[0];

                let checkInvalid = await this.ISInvalid(indexValue, IdsNo)
                if (!checkInvalid) {
                    var comIndexValue = { "compressibilityIndex": indexValue };
                }
                tempTDObj.arr.push(comIndexValue);
                //globalData.arrTDTData.push(comIndexValue);
            }

            var hausnerRatio = actualProtocol.includes("Hausner Ratio (Vo/Vf)");
            if (hausnerRatio == true) {
                var hauRatio = actualProtocol.split(':');
                var hauRatioVal = hauRatio[1].trim();
                var hauRatioValue = hauRatioVal.split(' ')[0];
                var hauRatioValue1 = hauRatioValue.split('N')[0];

                let checkInvalid = await this.ISInvalid(hauRatioValue1, IdsNo)
                if (!checkInvalid) {
                    var hausnerRatioValue = { "hausnerRatio": hauRatioValue1 };
                    tempTDObj.arr.push(hausnerRatioValue);
                }
                //globalData.arrTDTData.push(hausnerRatioValue);
            }

            return tdValue;
        }
        else {
            /**
            * @description We are here setting TD000 and HD000 to true
            */
            var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
            tempTDHD.flag = true;
            tempTDHD.oc = tempTDHD.oc + 1;
            /************************************************************* */
            console.log(tempTDHD)
            if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                // var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                var tempTDTObj = globalData.arrTDTData.find(dt => dt.idsNo == IdsNo);


                try {
                    let res = await tdtData.saveTDTData(cubicleObj, tempTDTObj.arr, tempUserObject, IdsNo)
                    var objUpdateValidation = {
                        str_tableName: "tbl_cubical",
                        data: [
                            { str_colName: 'Sys_Validation', value: 0 },
                        ],
                        condition: [
                            { str_colName: 'Sys_IDSNo', value: IdsNo },
                        ]
                    }

                    await database.update(objUpdateValidation).catch(err => console.log(err));
                    await objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'TAPPED DENSITY', flag: 'COMPLETED' } });
                    var response = `${protocolIncomingType}R3,,,,`;
                    // Activity Log for TDT
                    if (res == 'Invalid data string') {
                        // Clear Array on Invalid String 
                        var tempTDOb = globalData.arrTDTData.find(td => td.idsNo == IdsNo);
                        if (tempTDOb == undefined) {
                            globalData.arrTDTData.push({ idsNo: IdsNo, arr: [], version : undefined  })
                        } else {
                            tempTDOb.arr = [];
                            tempTDOb.version = undefined 
                        }
                        var msg = `${protocolIncomingType}R40Invalid String,,,,`;
                        //var msg = `${protocolIncomingType}R40INVALID DATA,RECEIVED,RETRANSMIT DATA,,`
                        objInstrumentUsage.InstrumentUsage('TDT', IdsNo, 'tbl_instrumentlog_tapdensity', '', 'ended')
                        return msg;
                    } else {

                        let resReturn = await objSP.getRemarkForTD(res.repSerNO)
                        if (resReturn[1][0]['@remark'] == "Complies") {
                            response = `${protocolIncomingType}R1,,,,`;
                        } else {
                            response = `${protocolIncomingType}R2,,,,`;
                        }
                        var objActivity = {};
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Tapped Density Weighment Completed on IDS' + IdsNo });
                        var tempTDOb = globalData.arrTDTData.find(td => td.idsNo == IdsNo);
                        if (tempTDOb == undefined) {
                            globalData.arrTDTData.push({ idsNo: IdsNo, arr: [], version : undefined })
                        } else {
                            tempTDOb.arr = [];
                            tempTDOb.version = undefined 
                        }
                        objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                        // Instrument usage for TDT completed
                        objInstrumentUsage.InstrumentUsage('TDT', IdsNo, 'tbl_instrumentlog_tapdensity', '', 'completed')
                        return response;



                    }
                }
                catch (err) {
                    var TDObj = globalData.arrTDTData.find(td => td.idsNo == IdsNo);
                    if (TDObj == undefined) {
                        globalData.arrTDTData.push({ idsNo: IdsNo, arr: [], version : undefined  })
                    } else {
                        TDObj.arr = [];
                        TDObj.version = undefined 
                    }
                    console.log(err)
                    return '+';
                }

            } else {
                console.log('REPEAT_COUNT FOR TDHD000');
                return '+';
            }
        }




    }

    /**
     * @description coding according to new friability string
     * @param {*} IdsNo 
     * @param {*} protocol 
     */

    insertBulkWeighmentFriability_80_column(IdsNo, protocol) {
        return new Promise((resolve, reject) => {
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var actualProtocol = protocol;
            var tdValue = actualProtocol.substring(0, 5);//starting 
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var protocolIncomingType = tdValue.substring(0, 1);//here incoming protocol is check T Or H
            if (tdValue != "TD000" && tdValue != "HD000" && tdValue != "ED000") {
                var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                var intervalFlag = globalData.arrIntervalFlag.find(k => k.IdsNo == IdsNo);
                var tempFriabilityObj = globalData.arrFriabilityData.find(td => td.idsNo == IdsNo);

                var drum = actualProtocol.includes("DRUM-1");
                if (drum == true) {
                    intervalFlag.flgFriabilityFlag = true;
                    // Activity Log for Friability start
                    var objActivity = {};
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'Friability Weighment Started on IDS' + IdsNo });
                    objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                    // Instrument usage for Friability started
                    objInstrumentUsage.InstrumentUsage('Friability', IdsNo, 'tbl_instrumentlog_friability', 'Friability', 'started')
                }
                var comments = actualProtocol.includes("COMMENTS");
                if (comments == true) {
                    intervalFlag.flgFriabilityFlag = false;
                }
                if (cubicalObj.Sys_RotaryType == 'Single') {
                    if (intervalFlag.flgFriabilityFlag == true) {
                        var incomingProtocol = actualProtocol.split('|');
                        var drum1Val = incomingProtocol[0];
                        //var drum2Val = incomingProtocol[1];//drum2 value 
                        var drum1Before = drum1Val.includes('WEIGHT BEFORE TEST');
                        if (drum1Before == true) {
                            var wgtBefore = drum1Val.split(':')[1];
                            var wgtBeforeVal = wgtBefore.split(' ')[1];
                            var singlebeforeVal = { 'before': wgtBeforeVal };
                            //globalData.arrFriabilityData.push(singlebeforeVal); 
                            tempFriabilityObj.arr.push(singlebeforeVal);
                        }
                        var drum1after = drum1Val.includes('WEIGHT AFTER TEST');
                        if (drum1after == true) {
                            var wgtAfter = drum1Val.split(':')[1];
                            var wgtAfterVal = wgtAfter.split(' ')[1];
                            var singleAfterVal = { 'after': wgtAfterVal };
                            //globalData.arrFriabilityData.push(singleAfterVal); 
                            tempFriabilityObj.arr.push(singleAfterVal);
                        }
                    }
                }
                else {
                    if (intervalFlag.flgFriabilityFlag == true) {
                        if (actualProtocol.includes('|')) {
                            var incomingProtocol = actualProtocol.split('|');
                            var drum1Val = incomingProtocol[0];
                            var drum2Val = incomingProtocol[1];//drum2 value 
                            var drum1Before = drum1Val.includes('WEIGHT BEFORE TEST');
                            if (drum1Before == true) {
                                var wgtBefore = drum1Val.split(':')[1];
                                var wgtBeforeVal = wgtBefore.split(' ')[1];
                                var singlebeforeVal = { 'before': wgtBeforeVal };
                                //globalData.arrFriabilityData.push(singlebeforeVal);
                                tempFriabilityObj.arr.push(singlebeforeVal);
                            }
                            var drum1after = drum1Val.includes('WEIGHT AFTER TEST');
                            if (drum1after == true) {
                                var wgtAfter = drum1Val.split(':')[1];
                                var wgtAfterVal = wgtAfter.split(' ')[1];
                                var singleAfterVal = { 'after': wgtAfterVal };
                                //globalData.arrFriabilityData.push(singleAfterVal); 
                                tempFriabilityObj.arr.push(singleAfterVal);
                            }

                            var drum2Before = drum2Val.includes('WEIGHT BEFORE TEST');
                            if (drum2Before == true) {
                                var wgtBefore = drum2Val.split(':')[1];
                                var wgtBeforeVal = wgtBefore.split(' ')[1];
                                var singlebeforeVal = { 'before1': wgtBeforeVal };
                                //globalData.arrFriabilityData.push(singlebeforeVal);
                                tempFriabilityObj.arr.push(singlebeforeVal);
                            }
                            var drum2after = drum2Val.includes('WEIGHT AFTER TEST');
                            if (drum2after == true) {
                                var wgtAfter = drum2Val.split(':')[1];
                                var wgtAfterVal = wgtAfter.split(' ')[1];
                                var singleAfterVal = { 'after1': wgtAfterVal };
                                //globalData.arrFriabilityData.push(singleAfterVal); 
                                tempFriabilityObj.arr.push(singleAfterVal);
                            }
                        }

                    }
                }

                resolve(tdValue);
            }
            else {
                // console.log(globalData.arrFriabilityData);
                var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                var tempFriabilityObj = globalData.arrFriabilityData.find(dt => dt.idsNo == IdsNo);
                friabilityData.saveFriability(productObj, tempFriabilityObj.arr, tempUserObject, IdsNo).then(res => {
                    var objUpdateValidation = {
                        str_tableName: "tbl_cubical",
                        data: [
                            { str_colName: 'Sys_Validation', value: 0 },
                        ],
                        condition: [
                            { str_colName: 'Sys_CubicNo', value: productObj.Sys_CubicNo },
                        ]
                    }

                    database.update(objUpdateValidation).catch(err => console.log(err));
                })
                var response = `${protocolIncomingType}R3,,,,`;
                // Activity Log for Friability Complete
                var objActivity = {};
                Object.assign(objActivity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                    { activity: 'Friability Weighment Completed on IDS' + IdsNo });
                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                // Instrument usage for Friability completed
                objInstrumentUsage.InstrumentUsage('Friability', IdsNo, 'tbl_instrumentlog_friability', '', 'completed')
                resolve(response);
            }
        })
    }

    /**
     * 
     * @param {*} IdsNo 
     * @param {*} protocol 
     * @description Coding for 40m 
     */
    insertBulkWeighmentFriability(IdsNo, protocol) {
        return new Promise((resolve, reject) => {
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
            var selectedIds;
            var ActualRPM = "";
            var ActualCount = ""
            var intervalFound;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var actualProtocol = protocol;
            var tdValue = actualProtocol.substring(0, 5);//starting 
            var recPrtotocol = actualProtocol.substring(7).trim().split(" ");
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var protocolIncomingType = tdValue.substring(0, 1);//here incoming protocol is check T Or H
            if (tdValue != "TD000" && tdValue != "HD000" && tdValue != "ED000") {
                /**
                * @description We are here setting TD000 and HD000 to false
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }
                /************************************************************* */
                var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                var intervalFlag = globalData.arrIntervalFlag.find(k => k.IdsNo == IdsNo);
                var tempFriabilityObj = globalData.arrFriabilityData.find(td => td.idsNo == IdsNo);

                if (actualProtocol.includes("SET RPM") == true) {
                    intervalFlag.IntervalRecived = true;
                    const objBulkInvalid = new bulkInvalid();
                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                    objBulkInvalid.invalidObj.Friabilitor.invalid = false;
                    objBulkInvalid.invalidObj.Friabilitor.invalidMsg = "";
                    Object.assign(objInvalid, objBulkInvalid.invalidObj);

                    intervalFlag.flgFriabilityFlag = true;
                    var tempFriabilityObj = globalData.arrFriabilityData.find(td => td.idsNo == IdsNo);
                    tempFriabilityObj.arr = [];
                    // Activity Log for Friability start
                    var objActivity = {};
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'Friability Weighment Started on IDS' + IdsNo });
                    objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                    // Instrument usage for Friability started
                    objInstrumentUsage.InstrumentUsage('Friability', IdsNo, 'tbl_instrumentlog_friability', 'Friability', 'started')
                }

                if (actualProtocol.includes("VERSION NO") == true) {

                    var version = actualProtocol.split(':')[1];
                    version = version.split(/[NRnr]+/)[0].trim();
                    version = version == 'V2.9' ? 'V2.9' : 'V2.8'
                    tempFriabilityObj.version = version;
                    console.log(actualProtocol);
                }

                // var singlebeforeVal = { 'before': wgtBeforeVal };
                // tempFriabilityObj.arr.push(singlebeforeVal);

                if (intervalFlag.IntervalRecived == true) {
                    // if (actualProtocol.includes("INTERVAL") != true) {
                    if (actualProtocol[0] != "") {
                        var version = tempFriabilityObj.version;
                        if (version == 'V2.8') {
                            ActualRPM = actualProtocol.split(':')[2].trim();
                        }
                        else {
                            ActualRPM = actualProtocol.split(':')[1].trim();

                            // var count = recPrtotocol.length - 1
                            // ActualRPM = recPrtotocol[count].trim().substring(0, recPrtotocol[count].trim().length - 2)

                            //  tempFriabilityObj.ActualCount = ActualCount0

                        }
                        ActualRPM = ActualRPM.substring(0, ActualRPM.length - 2);
                        tempFriabilityObj.ActualRPM = ActualRPM
                        intervalFlag.IntervalRecived = false;

                    }
                    // }
                }
                if (actualProtocol.includes("SET COUNT") == true) {

                    var version = tempFriabilityObj.version;
                    if (version == 'V2.8') {
                        ActualCount = actualProtocol.split(':')[2].trim();
                        console.log(actualProtocol);
                    } else {
                        ActualCount = actualProtocol.split(':')[1].trim();
                    }
                    ActualCount = ActualCount.substring(0, ActualCount.length - 2);
                    tempFriabilityObj.ActualCount = ActualCount;
                }
                var calculations = actualProtocol.includes("CALCULATIONS");
                if (calculations == true) {
                    // const objBulkInvalid = new bulkInvalid();
                    // objBulkInvalid.invalidObj.idsNo = IdsNo;
                    // objBulkInvalid.invalidObj.Friabilitor.invalid = false;
                    // objBulkInvalid.invalidObj.Friabilitor.invalidMsg = "";
                    // Object.assign(objInvalid, objBulkInvalid.invalidObj);

                    // intervalFlag.flgFriabilityFlag = true;
                    // var tempFriabilityObj = globalData.arrFriabilityData.find(td => td.idsNo == IdsNo);
                    // tempFriabilityObj.arr = [];
                    // // Activity Log for Friability start
                    // var objActivity = {};
                    // Object.assign(objActivity,
                    //     { strUserId: tempUserObject.UserId },
                    //     { strUserName: tempUserObject.UserName },
                    //     { activity: 'Friability Weighment Started on IDS' + IdsNo });
                    // objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                    // // Instrument usage for Friability started
                    // objInstrumentUsage.InstrumentUsage('Friability', IdsNo, 'tbl_instrumentlog_friability', 'Friability', 'started')
                }
                var comments = actualProtocol.includes("COMMENTS");
                if (comments == true) {
                    intervalFlag.flgFriabilityFlag = false;
                    intervalFlag.drum1 = false;
                    intervalFlag.drum2 = false;
                }
                if (cubicalObj.Sys_RotaryType == 'Single') {
                    if (intervalFlag.flgFriabilityFlag == true) {
                        var drum1 = actualProtocol.includes('DRUM-1');
                        if (drum1 == true) {
                            intervalFlag.drum1 = true;
                        }
                        if (intervalFlag.drum1 == true) {
                            var drum1Before = actualProtocol.includes('WGT BEFORE TEST') || actualProtocol.includes('WEIGHT BEFORE TEST');
                            if (drum1Before == true) {
                                var wgtBefore = actualProtocol.split(':')[1];
                                var wgtBeforeVal = wgtBefore.split(' ')[1];
                                var checkB1 = parseFloat(wgtBeforeVal);
                                checkB1 = checkB1.toString();
                                if (checkB1 == "NaN") {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.Friabilitor.invalid = true;
                                    objBulkInvalid.invalidObj.Friabilitor.invalidMsg = "INVALID WGT BEFORE,TEST FOR DRUM-1,,,";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                                var singlebeforeVal = { 'before': wgtBeforeVal };
                                tempFriabilityObj.arr.push(singlebeforeVal);
                            }
                            var drum1after = actualProtocol.includes('WGT AFTER TEST') || actualProtocol.includes('WEIGHT AFTER TEST');
                            if (drum1after == true) {
                                var wgtAfter = actualProtocol.split(':')[1];
                                var wgtAfterVal = wgtAfter.split(' ')[1];
                                var checkA1 = parseFloat(wgtAfterVal);
                                checkA1 = checkA1.toString();
                                if (checkA1 == "NaN") {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.Friabilitor.invalid = true;
                                    objBulkInvalid.invalidObj.Friabilitor.invalidMsg = "INVALID WGT AFTER,TEST FOR DRUM-1,,,";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                                var singleAfterVal = { 'after': wgtAfterVal };
                                //globalData.arrFriabilityData.push(singleAfterVal); 
                                tempFriabilityObj.arr.push(singleAfterVal);
                                intervalFlag.drum1 = false;
                            }

                        }
                    }
                }
                else {
                    if (intervalFlag.flgFriabilityFlag == true) {
                        var drum1 = actualProtocol.includes('DRUM-1');
                        if (drum1 == true) {
                            intervalFlag.drum1 = true;
                        }
                        if (intervalFlag.drum1 == true) {
                            var drum1Before = actualProtocol.includes('WGT BEFORE TEST') || actualProtocol.includes('WEIGHT BEFORE TEST');
                            if (drum1Before == true) {
                                var wgtBefore = actualProtocol.split(':')[1];
                                var wgtBeforeVal = wgtBefore.split(' ')[1];
                                var checkB1 = parseFloat(wgtBeforeVal);
                                checkB1 = checkB1.toString();
                                if (checkB1 == "NaN") {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.Friabilitor.invalid = true;
                                    objBulkInvalid.invalidObj.Friabilitor.invalidMsg = "INVALID WGT BEFORE,TEST FOR DRUM-1,,,";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                                var singlebeforeVal = { 'before': wgtBeforeVal };
                                //globalData.arrFriabilityData.push(singlebeforeVal); 
                                tempFriabilityObj.arr.push(singlebeforeVal);
                            }
                            var drum1after = actualProtocol.includes('WGT AFTER TEST') || actualProtocol.includes('WEIGHT AFTER TEST');
                            if (drum1after == true) {
                                var wgtAfter = actualProtocol.split(':')[1];
                                var wgtAfterVal = wgtAfter.split(' ')[1];
                                var checkA1 = parseFloat(wgtAfterVal);
                                checkA1 = checkA1.toString();
                                if (checkA1 == "NaN") {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.Friabilitor.invalid = true;
                                    objBulkInvalid.invalidObj.Friabilitor.invalidMsg = "INVALID WGT AFTER,TEST FOR DRUM-1,,,";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                                var singleAfterVal = { 'after': wgtAfterVal };
                                //globalData.arrFriabilityData.push(singleAfterVal); 
                                tempFriabilityObj.arr.push(singleAfterVal);
                                intervalFlag.drum1 = false;
                            }

                        }
                        var drum2 = actualProtocol.includes('DRUM-2');
                        if (drum2 == true) {
                            intervalFlag.drum2 = true;
                        }
                        if (intervalFlag.drum2 == true) {
                            var drum1Before = actualProtocol.includes('WGT BEFORE TEST') || actualProtocol.includes('WEIGHT BEFORE TEST');
                            if (drum1Before == true) {
                                var wgtBefore = actualProtocol.split(':')[1];
                                var wgtBeforeVal = wgtBefore.split(' ')[1];
                                var checkB2 = parseFloat(wgtBeforeVal);
                                checkB2 = checkB2.toString();
                                if (checkB2 == "NaN") {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.Friabilitor.invalid = true;
                                    objBulkInvalid.invalidObj.Friabilitor.invalidMsg = "INVALID WGT BEFORE,TEST FOR DRUM-2,,,";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                                var singlebeforeVal = { 'before1': wgtBeforeVal };
                                //globalData.arrFriabilityData.push(singlebeforeVal); 
                                tempFriabilityObj.arr.push(singlebeforeVal);
                            }
                            var drum1after = actualProtocol.includes('WGT AFTER TEST') || actualProtocol.includes('WEIGHT AFTER TEST');
                            if (drum1after == true) {
                                var wgtAfter = actualProtocol.split(':')[1];
                                var wgtAfterVal = wgtAfter.split(' ')[1];
                                var checkA2 = parseFloat(wgtAfterVal);
                                checkA2 = checkA2.toString();
                                if (checkA2 == "NaN") {
                                    const objBulkInvalid = new bulkInvalid();
                                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                                    objBulkInvalid.invalidObj.Friabilitor.invalid = true;
                                    objBulkInvalid.invalidObj.Friabilitor.invalidMsg = "INVALID WGT AFTER,TEST FOR DRUM-2,,,";
                                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                }
                                var singleAfterVal = { 'after1': wgtAfterVal };
                                //globalData.arrFriabilityData.push(singleAfterVal); 
                                tempFriabilityObj.arr.push(singleAfterVal);
                                intervalFlag.drum2 == false;
                            }

                        }
                    }
                }

                resolve(tdValue);
            }
            else {
                /**
                 * @description We are here setting TD000 and HD000 to true
                 */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                console.log(tempTDHD)
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    // console.log(globalData.arrFriabilityData);
                    var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                    var tempFriabilityObj = globalData.arrFriabilityData.find(dt => dt.idsNo == IdsNo);
                    // console.log('In Bulk Weighnt', tempFriabilityObj)
                    // friabilityData.saveFriability(productObj, tempFriabilityObj.arr, tempUserObject, IdsNo).then(res => {
                    friabilityData.saveFriability(productObj, tempFriabilityObj, tempUserObject, IdsNo).then(res => {
                        var response;
                        var objUpdateValidation = {
                            str_tableName: "tbl_cubical",
                            data: [
                                { str_colName: 'Sys_Validation', value: 0 },
                            ],
                            condition: [
                                { str_colName: 'Sys_IDSNo', value: IdsNo },
                            ]
                        }

                        database.update(objUpdateValidation).catch(err => console.log(err));
                        if (res.status != 'success') {
                            response = `${protocolIncomingType}R40Invalid String,,,,`;
                            //response = `${protocolIncomingType}R40INVALID DATA,RECEIVED,RETRANSMIT DATA,,`
                            objInstrumentUsage.InstrumentUsage('Friability', IdsNo, 'tbl_instrumentlog_friability', '', 'ended')
                            resolve(response);
                        } else {
                            //response = `${protocolIncomingType}R3,,,,`;
                            objSP.getRemarkForFriability(res.RepSerNo).then(result => {
                                if (result[1][0]['@remark'] == "Complies") {
                                    response = `${protocolIncomingType}R1,,,,`;
                                } else {
                                    response = `${protocolIncomingType}R2,,,,`;
                                }
                                // Activity Log for Friability Complete
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'Friability Weighment Completed on IDS' + IdsNo });
                                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                                // Instrument usage for Friability completed
                                objInstrumentUsage.InstrumentUsage('Friability', IdsNo, 'tbl_instrumentlog_friability', '', 'completed')
                                resolve(response);
                            }).catch(err => {
                                var msg = `${protocolIncomingType}R40Invalid String,,,,`;
                                //var msg = `${protocolIncomingType}R40INVALID DATA,RECEIVED,RETRANSMIT DATA,,`
                                objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'FRIABILATOR', flag: 'ABORTED' } });
                                objInstrumentUsage.InstrumentUsage('Friability', IdsNo, 'tbl_instrumentlog_friability', '', 'ended')
                                resolve(msg);
                            })

                        }


                    }).catch(err => {
                        var msg = `${protocolIncomingType}R40Invalid String,,,,`;
                        //var msg = `${protocolIncomingType}R40INVALID DATA,RECEIVED,RETRANSMIT DATA,,`
                        // let responseObj;
                        // Object.assign(responseObj, { status: 'fail', msg: msg });
                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'FRIABILATOR', flag: 'ABORTED' } });
                        objInstrumentUsage.InstrumentUsage('Friability', IdsNo, 'tbl_instrumentlog_friability', '', 'ended')
                        resolve(msg);
                    })
                } else {
                    console.log('REPEAT_COUNT FOR TDHD000');
                    resolve('+')
                }

            }
        })
    }
    async insertBulkFriabilityComb(IdsNo, protocol) {
        try {
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
            var selectedIds;
            var ActualRPM = "";
            var ActualCount = ""
            var intervalFound;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var actualProtocol = protocol;
            var tdValue = actualProtocol.substring(0, 5);//starting 
            var recPrtotocol = actualProtocol.substring(7).trim().split(" ");
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var protocolIncomingType = tdValue.substring(0, 1);//here incoming protocol is check T Or H
            if (tdValue != protocolIncomingType + "D000") {
                /**
                * @description We are here setting TD000 and HD000 to false
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }
                /************************************************************* */
                var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                var intervalFlag = globalData.arrIntervalFlag.find(k => k.IdsNo == IdsNo);
                var tempFriabilityObj = globalData.arrFriabilityData.find(td => td.idsNo == IdsNo);
                if (actualProtocol.includes("SET RPM") == true) {
                    intervalFlag.IntervalRecived = true;
                    const objBulkInvalid = new bulkInvalid();
                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                    objBulkInvalid.invalidObj.Friabilitor.invalid = false;
                    objBulkInvalid.invalidObj.Friabilitor.invalidMsg = "";
                    Object.assign(objInvalid, objBulkInvalid.invalidObj);

                    intervalFlag.flgFriabilityFlag = true;
                    var tempFriabilityObj = globalData.arrFriabilityData.find(td => td.idsNo == IdsNo);
                    tempFriabilityObj.arr = [];
                    // Activity Log for Friability start
                    var objActivity = {};
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'Friabilator Started on IDS' + IdsNo });
                    await objActivityLog.ActivityLogEntry(objActivity);
                    // Instrument usage for Friability started
                    objInstrumentUsage.InstrumentUsage('Friability', IdsNo, 'tbl_instrumentlog_friability', 'Friability', 'started')
                }

                // var singlebeforeVal = { 'before': wgtBeforeVal };
                // tempFriabilityObj.arr.push(singlebeforeVal);

                if (intervalFlag.IntervalRecived == true) {
                    // if (actualProtocol.includes("INTERVAL") != true) {
                    if (actualProtocol[0] != "") {
                        ActualRPM = actualProtocol.split(':')[1].trim();
                        ActualRPM = ActualRPM.substring(0, ActualRPM.length - 2)
                        // var count = recPrtotocol.length - 1
                        // ActualRPM = recPrtotocol[count].trim().substring(0, recPrtotocol[count].trim().length - 2)

                        //  tempFriabilityObj.ActualCount = ActualCount
                        tempFriabilityObj.ActualRPM = ActualRPM
                        intervalFlag.IntervalRecived = false;

                    }
                    // }
                }
                if (actualProtocol.includes("SET COUNT") == true) {
                    ActualCount = actualProtocol.split(':')[1].trim();
                    ActualCount = ActualCount.substring(0, ActualCount.length - 2);
                    tempFriabilityObj.ActualCount = ActualCount;
                }
                return tdValue;
            } else {
                /**
                * @description We are here setting TD000 and HD000 to true
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                var tempFriabilityObj = globalData.arrFriabilityData.find(td => td.idsNo == IdsNo);
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    if ('ActualRPM' in tempFriabilityObj && 'ActualCount' in tempFriabilityObj) {
                        if (!isNaN(tempFriabilityObj.ActualRPM) && !isNaN(tempFriabilityObj.ActualCount)) {
                            let retuRes = await fetchDetails.checkFriabilityStatus(IdsNo);
                            console.log('EOS', tempFriabilityObj);
                            if (retuRes.status != 'before') {
                                var updateFriability = {
                                    str_tableName: 'tbl_tab_friability',
                                    data: [
                                        { str_colName: 'ActualCount', value: tempFriabilityObj.ActualCount },
                                        { str_colName: 'ActualRPM', value: tempFriabilityObj.ActualRPM },
                                    ],
                                    condition: [
                                        { str_colName: 'RepSerNo', value: retuRes.sqNo },
                                    ]
                                }
                                await database.update(updateFriability);
                                var objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'Friabilator String completed on IDS' + IdsNo });
                                await objActivityLog.ActivityLogEntry(objActivity);
                                objInstrumentUsage.InstrumentUsage('Friability', IdsNo, 'tbl_instrumentlog_friability', '', 'completed')
                                if (serverConfig.friabilityType == 'BFBO' || serverConfig.friabilityType == 'BFBT') {
                                    var tempBFBO = globalData.arrBFBO.find(k => k.idsNo == selectedIds);
                                    tempBFBO.setParam = true;
                                }
                                return `${protocolIncomingType}R3`;
                            } else {
                                return `${protocolIncomingType}R3`;
                            }
                        } else {
                            var msg = "Invalid String,,,,"
                            //var msg = "INVALID DATA,RECEIVED,RETRANSMIT DATA,,"
                            return `${protocolIncomingType}R40${msg}`;
                        }
                    } else {
                        var msg = "Invalid String,,,,"
                        //var msg = "INVALID DATA,RECEIVED,RETRANSMIT DATA,,"
                        return `${protocolIncomingType}R40${msg}`;
                    }

                } else {
                    console.log('REPEAT_COUNT FOR TDHD000');
                    return '+';
                }
            }
        } catch (err) {
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            throw new Error(err);
        }
    }

    // single sample handling method
    async insertBulkWeighmentHardness_425_old_07_09_2022(IdsNo, protocol) {
        try {
            // Check when there isIPQC
            var IPQCObject = globalData.arr_IPQCRelIds.find((k) => k.idsNo == IdsNo);
            var selectedIds;
            var objLotData = globalData.arrLot.find((k) => k.idsNo == IdsNo);

            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var currentCubicle = globalData.arrIdsInfo.find(
                (k) => k.Sys_IDSNo == selectedIds
            );
            var actualProtocol = protocol;
            let now = new Date();
            var protocolValue = protocol.substring(0, 5); // starting 5 character
            var protocolValueData = protocol.substring(6); // starting 5 character
            var protocolIncomingType = protocolValue.substring(0, 1); //Check incoming Protocol is from "T" or "H"
            //var hardnessReading = protocol.substring(0, 7);
            const tempUserObject = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
            var objHardness = globalData.arrHardness425.find(
                (ht) => ht.idsNo == IdsNo
            );
            var productlimits = globalData.arr_limits.find((al) => al.idsNo == IdsNo);
            var objInvalid = globalData.arrBulkInvalid.find((k) => k.idsNo == IdsNo);

            if (protocolValue != "TD000" && protocolValue != "HD000") {
                /**
                 * @description We are here setting TD000 and HD000 to false
                 */
                var tempTDHD = globalData.arrTHHDrepet.find((k) => k.idsNo == IdsNo);
                if (tempTDHD == undefined) {
                    globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 });
                } else {
                    tempTDHD.flag = false;
                    tempTDHD.oc = 0;
                }
                /************************************************************* */
                var IncludeX = actualProtocol.includes("X");
                //console.log("IncludeX", IncludeX);
                if (IncludeX == true) {
                    var receivedProtocol = actualProtocol.replace("X", "").trim();
                    const objBulkInvalid = new bulkInvalid();
                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                    objBulkInvalid.invalidObj.HD425.invalid = false;
                    objBulkInvalid.invalidObj.HD425.invalidMsg = "";
                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                } else {
                    IncludeX = false;
                }
                if (IncludeX == true) {
                    //console.log("IncludeX", IncludeX);
                    if (
                        receivedProtocol.includes("mm") &&
                        objHardness.dimensionParam == 0
                    ) {
                        var includeMM = protocolValueData.includes("mm");
                        //console.log("includeMM", includeMM);
                        if (includeMM == true) {
                            // var thicknessVal = protocolValueData.replace("mm", "").trim();
                            // if (protocolValueData.split('m')[0].trim() == "--") {
                            //     objHardness.thicknessVal = 0;
                            // } else {
                            objHardness.thicknessVal = protocolValueData.split("mm")[0].trim();
                            // }
                            objHardness.thicknessDecimal = 2; //thicknessVal.split('.').replace(/\D/g, '').length;//count number in given string
                            //Repeat is handled at the start So No need to check again
                            //if (receivedProtocol.includes("R") != true) {
                            objHardness.sampleNo = objHardness.sampleNo + 1;
                            //}

                            objHardness.dimensionParam = 1;
                            var isThickValid = parseFloat(objHardness.thicknessVal);
                            var isThickValid = isThickValid.toString();
                            // if(isThickValid == 'NaN') {
                            //     const objBulkInvalid = new bulkInvalid();
                            //     objBulkInvalid.invalidObj.idsNo = IdsNo;
                            //     objBulkInvalid.invalidObj.HD425.invalid = true;
                            //     objBulkInvalid.invalidObj.HD425.invalidMsg = "INVALID WGT PLS,REPEAT SAMPLES,,";
                            //     Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            // }
                            //console.log("First",objHardness);
                        }
                    } else if (
                        receivedProtocol.includes("mm") &&
                        objHardness.dimensionParam == 1
                    ) {
                        var includeMM = protocolValueData.includes("mm");
                        if (includeMM == true) {
                            // if (protocolValueData.split('m')[0].trim() == "--") {
                            //     objHardness.dimensionVal = 0;
                            // } else {
                            objHardness.dimensionVal = protocolValueData.split("mm")[0].trim();
                            // }
                            objHardness.dimensionDecimal = 2; // dimensionVal.split('.').replace(/\D/g, '').length;//count number in given string
                            objHardness.dimensionParam = 2;
                            //var isDimensionsValid = parseFloat(objHardness.dimensionVal);
                            //var isDimensionsValid = isDimensionsValid.toString();
                            // if(isDimensionsValid == 'NaN') {
                            //     const objBulkInvalid = new bulkInvalid();
                            //     objBulkInvalid.invalidObj.idsNo = IdsNo;
                            //     objBulkInvalid.invalidObj.HD425.invalid = true;
                            //     objBulkInvalid.invalidObj.HD425.invalidMsg = "INVALID WGT PLS,REPEAT SAMPLES,,";
                            //     Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            // }
                            //console.log("SEcond",objHardness);
                        }
                    } else if (
                        receivedProtocol.includes("N") &&
                        objHardness.dimensionParam == 2
                    ) {
                        //|| receivedProtocol.includes("KP") ) {
                        // if (receivedProtocol.includes("--") != true) {

                        //objHardness.dimensionParam = 0;

                        objHardness.dimensionParam = 3;

                        var includeNorKp = protocolValueData.includes("N");
                        //var hardnessVal = 0;
                        if (includeNorKp == true) {
                            //var strRecivedProtocol = app.protocolToString(Buffer.from(protocolValueData,'utf8'));

                            objHardness.hardnessVal = protocolValueData.split("N")[0].trim().length == 0 ? 0 : protocolValueData.split("N")[0].trim()
                            // if (objHardness.hardnessVal == "") {
                            //     objHardness.hardnessVal = "NA";
                            // }
                            // else if(objHardness.hardnessVal == '--'){
                            //     objHardness.hardnessVal = 0;
                            // }
                            // var isHardnessValid = parseFloat(objHardness.hardnessVal);
                            // var isHardnessValid = isHardnessValid.toString();
                            // const objBulkInvalid = new bulkInvalid();
                            // objBulkInvalid.invalidObj.idsNo = IdsNo;
                            // if (isHardnessValid == "NaN" && !isHardnessValid == "NA") {
                            //     objBulkInvalid.invalidObj.HD425.invalid = true;
                            //     objBulkInvalid.invalidObj.HD425.invalidMsg =
                            //         "INVALID WGT PLS,REPEAT SAMPLES,,";
                            //     Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            // }
                            // objBulkInvalid.invalidObj.HD425.invalid = false;
                            // if (
                            //     objBulkInvalid.invalidObj.HD425.invalid &&
                            //     objHardness.sampleNo == 1
                            // ) {
                            //     //var msg = "Invalid String,FORMAT PLS REPEAT,SAME SAMPLE,,"
                            //     var msg = `${protocolIncomingType}R40Invalid String,,,,`;
                            //     objHardness.sampleNo = objHardness.sampleNo - 1;
                            //     return msg;
                            // } else {
                            objHardness.hardnessDecimal = includeNorKp == true ? 0 : 2; // hardnessVal.split('.').replace(/\D/g, '').length;//count number in given string
                            //console.log("Hardness",objHardness);
                            var HardnessUnit = "N";
                            var doMasterEntry = objHardness.sampleNo == 1 ? true : false;
                            //added by vivek on 11-11-2019***************************/
                            var tempLimObj = globalData.arr_limits.find(
                                (k) => k.idsNo == IdsNo
                            );
                            var intNos = tempLimObj.Hardness.noOfSamples;
                            /***************************************************** */

                            if (objHardness.sampleNo <= intNos) {
                                if (doMasterEntry == true) {
                                    let objActivity = {};
                                    Object.assign(
                                        objActivity,
                                        { strUserId: tempUserObject.UserId },
                                        { strUserName: tempUserObject.UserName },
                                        { activity: "Hardness Weighment Started on IDS" + IdsNo }
                                    );
                                    await objActivityLog
                                        .ActivityLogEntry(objActivity)
                                        .catch((error) => {
                                            //logFromPC.addtoProtocolLog(error, "error");
                                            console.log(error);
                                        });
                                    var productObj = globalData.arrIdsInfo.find(
                                        (k) => k.Sys_IDSNo == selectedIds
                                    );

                                    const checkMasterData = {
                                        str_tableName: "tbl_tab_masterhtd_incomplete",
                                        data: "MAX(MstSerNo) AS SeqNo",
                                        condition: [
                                            {
                                                str_colName: "BFGCode",
                                                value: productObj.Sys_BFGCode,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "ProductName",
                                                value: productObj.Sys_ProductName,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "PVersion",
                                                value: productObj.Sys_PVersion,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "Version",
                                                value: productObj.Sys_Version,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "BatchNo",
                                                value: productObj.Sys_Batch,
                                                comp: "eq",
                                            },
                                            { str_colName: "Idsno", value: IdsNo, comp: "eq" },
                                        ],
                                    };
                                    // console.log("tbl_tab_masterhtd_incomplete  1 :" + checkMasterData);
                                    var result = await database.select(checkMasterData);
                                    var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                        (sr) => sr.idsNo == IdsNo
                                    );
                                    var intMstSerNo;
                                    if (result[0][0].SeqNo == null) {
                                        intMstSerNo = 1;
                                        objIncompIdHardness.incompRepSerNo = intMstSerNo;
                                    } else {
                                        var newMstSerNo = result[0][0].SeqNo + 1;
                                        intMstSerNo = newMstSerNo;
                                        objIncompIdHardness.incompRepSerNo = intMstSerNo;
                                    }

                                    /***  AS PER shraddhanands and vinod powade: bredth will always perform on Vernier so we are not checking it in
                                                        Multiparameter hardness **/
                                    // if (productlimits.Breadth != undefined) {
                                    //     objHardness.colName = "Breadth";
                                    //     objHardness.opNominal = productlimits.Breadth.nominal;
                                    //     objHardness.opNegTol = productlimits.Breadth.T2Neg;
                                    //     objHardness.opPosTol = productlimits.Breadth.T2Pos;
                                    // }
                                    // else
                                    if (productlimits.Length != undefined) {
                                        objHardness.colName = "Length";
                                        objHardness.opNominal = productlimits.Length.nominal;
                                        objHardness.opNegTol = productlimits.Length.T2Neg;
                                        objHardness.opPosTol = productlimits.Length.T2Pos;
                                    } else if (productlimits.Diameter != undefined) {
                                        objHardness.colName = "Diameter";
                                        objHardness.opNominal = productlimits.Diameter.nominal;
                                        objHardness.opNegTol = productlimits.Diameter.T2Neg;
                                        objHardness.opPosTol = productlimits.Diameter.T2Pos;
                                    } else {
                                        objHardness.colName = "NA";
                                        objHardness.opNominal = 0;
                                        objHardness.opNegTol = 0;
                                        objHardness.opPosTol = 0;
                                    }

                                    if (productlimits.Thickness == undefined) {
                                        objHardness.thicknessNom = 0;
                                        objHardness.thicknesneg = 0;
                                        objHardness.thicknespos = 0;
                                    } else {
                                        objHardness.thicknessNom =
                                            productlimits.Thickness.nominal;
                                        objHardness.thicknesneg = productlimits.Thickness.T2Neg;
                                        objHardness.thicknespos = productlimits.Thickness.T2Pos;
                                    }

                                    var side = "NA";
                                    if (productObj.Sys_RotaryType == "Single") {
                                        side = "NA";
                                    } else {
                                        side = productlimits.Hardness.side == "L" ? "LHS" : "RHS";
                                    }

                                    await clspowerbackup.insertPowerBackupData(
                                        currentCubicle,
                                        protocolIncomingType,
                                        tempUserObject,
                                        IdsNo,
                                        "htd",
                                        "Erweka TBH-425",
                                        "Hardness"
                                    );
                                    var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
                                    var masterIncopleteData = {
                                        str_tableName: "tbl_tab_masterhtd_incomplete",
                                        data: [
                                            {
                                                str_colName: "MstSerNo",
                                                value: objIncompIdHardness.incompRepSerNo,
                                            },
                                            { str_colName: "InstruId", value: 1 },
                                            {
                                                str_colName: "BFGCode",
                                                value: productObj.Sys_BFGCode,
                                            },
                                            {
                                                str_colName: "ProductName",
                                                value: productObj.Sys_ProductName,
                                            },
                                            {
                                                str_colName: "ProductType",
                                                value: ProductType.productType,
                                            },

                                            { str_colName: "Idsno", value: IdsNo },
                                            {
                                                str_colName: "CubicalNo",
                                                value: productObj.Sys_CubicNo,
                                            },
                                            {
                                                str_colName: "BalanceId",
                                                value: productObj.Sys_BalID,
                                            },
                                            {
                                                str_colName: "VernierId",
                                                value: productObj.Sys_VernierID,
                                            },
                                            { str_colName: "BatchNo", value: productObj.Sys_Batch },
                                            { str_colName: "UserId", value: tempUserObject.UserId },
                                            {
                                                str_colName: "UserName",
                                                value: tempUserObject.UserName,
                                            },
                                            {
                                                str_colName: "PrDate",
                                                value: date.format(now, "YYYY-MM-DD"),
                                            },
                                            {
                                                str_colName: "PrTime",
                                                value: date.format(now, "HH:mm:ss"),
                                            },
                                            { str_colName: "Side", value: side },
                                            {
                                                str_colName: "Qty",
                                                value: productlimits.Hardness.noOfSamples,
                                            },
                                            { str_colName: "Unit", value: HardnessUnit },
                                            {
                                                str_colName: "CubicleType",
                                                value: productObj.Sys_CubType,
                                            },
                                            {
                                                str_colName: "ReportType",
                                                value: productObj.Sys_RptType,
                                            },
                                            {
                                                str_colName: "MachineCode",
                                                value: productObj.Sys_MachineCode,
                                            },
                                            {
                                                str_colName: "MFGCode",
                                                value: productObj.Sys_MfgCode,
                                            },
                                            {
                                                str_colName: "BatchSize",
                                                value: productObj.Sys_BatchSize,
                                            },
                                            {
                                                str_colName: "HardnessID",
                                                value: currentCubicle.Sys_HardID,
                                            },
                                            {
                                                str_colName: "CubicleName",
                                                value: productObj.Sys_dept,
                                            },
                                            {
                                                str_colName: "CubicleLocation",
                                                value: productObj.Sys_dept,
                                            },
                                            { str_colName: "IsArchived", value: 0 },
                                            {
                                                str_colName: "PVersion",
                                                value: productObj.Sys_PVersion,
                                            },
                                            {
                                                str_colName: "Version",
                                                value: productObj.Sys_Version,
                                            },
                                            {
                                                str_colName: "ColHeadDOLOBO",
                                                value: objHardness.colName,
                                            },
                                            {
                                                str_colName: "NomThick",
                                                value: objHardness.thicknessNom,
                                            },
                                            {
                                                str_colName: "PosTolThick",
                                                value: objHardness.thicknespos,
                                            },
                                            {
                                                str_colName: "NegTolThick",
                                                value: objHardness.thicknesneg,
                                            },
                                            {
                                                str_colName: "NomHard",
                                                value: productlimits.Hardness.nominal,
                                            },
                                            {
                                                str_colName: "PosTolHard",
                                                value: productlimits.Hardness.T1Pos,
                                            },
                                            {
                                                str_colName: "NegTolHard",
                                                value: productlimits.Hardness.T1Neg,
                                            },
                                            {
                                                str_colName: "NomDOLOBO",
                                                value: objHardness.opNominal,
                                            },
                                            {
                                                str_colName: "PosTolDOLOBO",
                                                value: objHardness.opPosTol,
                                            },
                                            {
                                                str_colName: "NegTolDOLOBO",
                                                value: objHardness.opNegTol,
                                            },
                                            {
                                                str_colName: "GraphType",
                                                value: productlimits.Hardness.LimitOn[0],
                                            },
                                            {
                                                str_colName: "RepoLabel11",
                                                value: currentCubicle.Sys_Validation,
                                            },
                                            {
                                                str_colName: "WgmtModeNo",
                                                value: 7,
                                            },
                                            { str_colName: "Lot", value: objLotData.LotNo },
                                            { str_colName: "Stage", value: productObj.Sys_Stage },
                                        ],
                                    };

                                    var masterSrno = await database.save(masterIncopleteData);

                                    var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                        (sr) => sr.idsNo == IdsNo
                                    );
                                    var objHardness = globalData.arrHardness425.find(
                                        (ht) => ht.idsNo == IdsNo
                                    );
                                    objInstrumentUsage.InstrumentUsage(
                                        "Hardness",
                                        IdsNo,
                                        "tbl_instrumentlog_hardness",
                                        "Hardness",
                                        "started"
                                    );
                                    objIncompIdHardness.incompRepSerNo = masterSrno[0].insertId;
                                    //console.log("Third",objHardness);

                                    const getRepsrNo = {
                                        str_tableName: "tbl_tab_masterhtd_incomplete",
                                        data: "MAX(RepSerNo) AS RepSerNo",
                                        condition: [
                                            {
                                                str_colName: "BFGCode",
                                                value: productObj.Sys_BFGCode,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "ProductName",
                                                value: productObj.Sys_ProductName,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "PVersion",
                                                value: productObj.Sys_PVersion,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "Version",
                                                value: productObj.Sys_Version,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "BatchNo",
                                                value: productObj.Sys_Batch,
                                                comp: "eq",
                                            },
                                            { str_colName: "Idsno", value: IdsNo, comp: "eq" },
                                        ],
                                    };


                                    var res = await database.select(getRepsrNo);
                                    let objUpdatepowerbackup = {
                                        str_tableName: "tbl_powerbackup",
                                        data: [
                                            {
                                                str_colName: "Incomp_RepSerNo",
                                                value: res[0][0].RepSerNo,
                                            },
                                        ],
                                        condition: [
                                            { str_colName: "Idsno", value: IdsNo },
                                            {
                                                str_colName: "Sys_BFGCode",
                                                value: productObj.Sys_BFGCode,
                                            },
                                            {
                                                str_colName: "Sys_Batch",
                                                value: productObj.Sys_Batch,
                                            },
                                        ],
                                    };
                                    await database.update(objUpdatepowerbackup);

                                    const insertDetailObj = {
                                        str_tableName: "tbl_tab_detailhtd_incomplete",
                                        data: [
                                            {
                                                str_colName: "RepSerNo",
                                                value: objIncompIdHardness.incompRepSerNo,
                                            },
                                            { str_colName: "MstSerNo", value: 0 },
                                            {
                                                str_colName: "RecSeqNo",
                                                value: objHardness.sampleNo,
                                            },
                                            {
                                                str_colName: "DataValueThick",
                                                value:
                                                    objHardness.thicknessNom == 0
                                                        ? 0
                                                        : objHardness.thicknessVal,
                                            },
                                            {
                                                str_colName: "DataValueDOLOBO",
                                                value:
                                                    objHardness.opNominal == 0
                                                        ? 0
                                                        : objHardness.dimensionVal,
                                            },
                                            {
                                                str_colName: "DataValueHard",
                                                value: objHardness.hardnessVal,
                                            },
                                            {
                                                str_colName: "DecimalPointThick",
                                                value:
                                                    objHardness.thicknessNom == 0
                                                        ? 0
                                                        : objHardness.thicknessDecimal,
                                            },
                                            {
                                                str_colName: "DecimalPointDOLOBO",
                                                value:
                                                    objHardness.opNominal == 0
                                                        ? 0
                                                        : objHardness.dimensionDecimal,
                                            },
                                            {
                                                str_colName: "DecimalPointHard",
                                                value: objHardness.hardnessDecimal,
                                            },
                                            {
                                                str_colName: "idsNo",
                                                value: parseInt(objHardness.idsNo),
                                            },
                                        ],
                                    };
                                    const DetailsEntries = {
                                        str_tableName: "tbl_tab_detailhtd_incomplete",
                                        data: 'MAX(RecSeqNo) AS SeqNo',
                                        condition: [
                                            { str_colName: 'RepSerNo', value: objIncompIdHardness.incompRepSerNo, comp: 'eq' }
                                        ]
                                    }
                                    var tabDetails = await database.select(DetailsEntries)
                                    if (tabDetails[0][0].SeqNo == null) {
                                        var entries = 1
                                    } else {
                                        var entries = tabDetails[0][0].SeqNo + 1
                                    }

                                    if (entries == objHardness.sampleNo) {

                                        await database.save(insertDetailObj);
                                    }
                                    else {
                                        console.log("repeat sample recieved at sampleno ", entries)
                                        objHardness.sampleNo = entries - 1
                                    }

                                    var tempObj = globalData.arrIncompleteRemark.find(
                                        (k) => k.IdsNo == IdsNo
                                    );
                                    if (tempObj == undefined) {
                                        globalData.arrIncompleteRemark.push({
                                            weighment: true,
                                            RepoSr: masterSrno[0].insertId,
                                            Type: 7,
                                            IdsNo: IdsNo,
                                        });
                                    } else {
                                        tempObj.weighment = true;
                                        tempObj.RepoSr = masterSrno[0].insertId;
                                        tempObj.Type = 7;
                                        //globalData.arrIncompleteRemark.IdsNo = IdsNo;
                                    }
                                } else {
                                    if (objHardness.sampleNo > 0) {
                                        var objHardness = globalData.arrHardness425.find(
                                            (ht) => ht.idsNo == IdsNo
                                        );
                                        var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                            (sr) => sr.idsNo == IdsNo
                                        );
                                        const insertDetailObj = {
                                            str_tableName: "tbl_tab_detailhtd_incomplete",
                                            data: [
                                                {
                                                    str_colName: "RepSerNo",
                                                    value: objIncompIdHardness.incompRepSerNo,
                                                },
                                                { str_colName: "MstSerNo", value: 0 },
                                                {
                                                    str_colName: "RecSeqNo",
                                                    value: objHardness.sampleNo,
                                                },
                                                {
                                                    str_colName: "DataValueThick",
                                                    value:
                                                        objHardness.thicknessNom == 0
                                                            ? 0
                                                            : objHardness.thicknessVal,
                                                },
                                                {
                                                    str_colName: "DataValueDOLOBO",
                                                    value:
                                                        objHardness.opNominal == 0
                                                            ? 0
                                                            : objHardness.dimensionVal,
                                                },
                                                {
                                                    str_colName: "DataValueHard",
                                                    value: objHardness.hardnessVal,
                                                },
                                                {
                                                    str_colName: "DecimalPointThick",
                                                    value:
                                                        objHardness.thicknessNom == 0
                                                            ? 0
                                                            : objHardness.thicknessDecimal,
                                                },
                                                {
                                                    str_colName: "DecimalPointDOLOBO",
                                                    value:
                                                        objHardness.opNominal == 0
                                                            ? 0
                                                            : objHardness.dimensionDecimal,
                                                },
                                                {
                                                    str_colName: "DecimalPointHard",
                                                    value: objHardness.hardnessDecimal,
                                                },
                                                {
                                                    str_colName: "idsNo",
                                                    value: parseInt(objHardness.idsNo),
                                                },
                                            ],
                                        };
                                        const DetailsEntries = {
                                            str_tableName: "tbl_tab_detailhtd_incomplete",
                                            data: 'MAX(RecSeqNo) AS SeqNo',
                                            condition: [
                                                { str_colName: 'RepSerNo', value: objIncompIdHardness.incompRepSerNo, comp: 'eq' }
                                            ]
                                        }
                                        var tabDetails = await database.select(DetailsEntries)
                                        if (tabDetails[0][0].SeqNo == null) {
                                            var entries = 1
                                        } else {
                                            var entries = tabDetails[0][0].SeqNo + 1
                                        }

                                        if (entries == objHardness.sampleNo) {

                                            await database.save(insertDetailObj);
                                        }
                                        else {
                                            console.log("repeat sample recieved at sampleno ", entries)
                                            objHardness.sampleNo = entries - 1
                                        }
                                        // globalData.sampleNo++;
                                    }
                                }
                            }

                        }
                        else {
                            return `${protocolIncomingType}R40Invalid String,,,,`;
                        }
                        // }
                    }
                    return protocolValue;
                } else {
                    return protocolValue;
                }
            } else {
                /**
                 * @description We are here setting TD000 and HD000 to true
                */
                var tempTDHD = globalData.arrTHHDrepet.find((k) => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                console.log(tempTDHD);

                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    if (objHardness.dimensionParam == 2 || objHardness.dimensionParam == 1 || objHardness.dimensionParam == 0) {
                        let objHardness = globalData.arrHardness425.find(
                            (ht) => ht.idsNo == IdsNo
                        );


                        objHardness.sampleNo = objHardness.dimensionParam == 0 ?
                            objHardness.sampleNo : objHardness.sampleNo - 1
                        objHardness.dimensionParam = 0;
                        var msg = "Invalid String,,,,"
                        return `${protocolIncomingType}R40${msg}`;

                    }
                    else {
                        objHardness.dimensionParam = 0;
                    }

                    var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);

                    if (objInvalid != undefined && objInvalid.HD425.invalid == true) {
                        //commented by vivek omm 14/05/2020*************
                        //resolve('DM000INVALID FORMAT,PLS REPEAT SAMPLE,,,');
                        //******************************************** */
                        var msg = "Invalid String,,,,"
                        //var msg = "INVALID DATA,RECEIVED,RETRANSMIT DATA,,"
                        return `${protocolIncomingType}R40${msg}`;
                    }
                    else {

                        var tempLimObj = globalData.arr_limits.find((k) => k.idsNo == IdsNo);
                        var intNos = tempLimObj.Hardness.noOfSamples;
                        var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                            (sr) => sr.idsNo == IdsNo
                        );
                        var objHardness = globalData.arrHardness425.find(
                            (ht) => ht.idsNo == IdsNo
                        );
                        var productObj = globalData.arrIdsInfo.find(
                            (k) => k.Sys_IDSNo == selectedIds
                        );
                        if (objHardness.sampleNo >= intNos) {
                            //console.log(globalData.hardnessIncompleteId);
                            await hardnessData.saveHardnessData(
                                objIncompIdHardness.incompRepSerNo,
                                IdsNo
                            );
                            // Clear flag for Incomplete remark on weighment complete like (test aborted, balance off, Auto logout);
                            if (globalData.arrIncompleteRemark != undefined) {
                                globalData.arrIncompleteRemark = globalData.arrIncompleteRemark.filter(
                                    (k) => k.IdsNo != IdsNo
                                );
                            }
                            var selectedIds;
                            var IPQCObject = globalData.arr_IPQCRelIds.find(
                                (k) => k.idsNo == IdsNo
                            );
                            if (IPQCObject != undefined) {
                                selectedIds = IPQCObject.selectedIds;
                            } else {
                                selectedIds = IdsNo;
                            }
                            var objUpdateValidation = {
                                str_tableName: "tbl_cubical",
                                data: [{ str_colName: "Sys_Validation", value: 0 }],
                                condition: [{ str_colName: "Sys_IDSNo", value: selectedIds }],
                            };

                            await database.update(objUpdateValidation);
                            let objActivity = {};
                            Object.assign(
                                objActivity,
                                { strUserId: tempUserObject.UserId },
                                { strUserName: tempUserObject.UserName },
                                { activity: "Hardness Weighment Completed on IDS" + IdsNo }
                            );
                            await objActivityLog.ActivityLogEntry(objActivity);
                            objHardness.sampleNo = 0;
                            var response = `${protocolIncomingType}R3,,,,,`;
                            objInstrumentUsage.InstrumentUsage(
                                "Hardness",
                                IdsNo,
                                "tbl_instrumentlog_hardness",
                                "",
                                "completed"
                            );
                            objMonitor.monit({
                                case: "BL",
                                idsNo: IdsNo,
                                data: { test: "HARDNESS", flag: "COMPLETED" },
                            });
                            return response;
                        } else {
                            // var response = `${protocolIncomingType}R3,,,,,`;
                            // resolve(response);
                            //HR0<>,<>,<>,<>,<>,
                            objMonitor.monit({
                                case: "HDT",
                                idsNo: IdsNo,
                                data: { sample: objHardness.sampleNo, flag: "start" },
                            });
                            var HRDProtocol =
                                `${protocolIncomingType}R0` +
                                objHardness.sampleNo +
                                " Samples Received,,,,,";
                            return HRDProtocol;
                        }
                    }

                } else {
                    console.log("REPEAT_COUNT FOR TDHD000");
                    return "+";
                }

            }
        } catch (err) {
            console.log(err);
        }
    }

    // can handle multiple samples [akshay]
    async insertBulkWeighmentHardness_425_old_09_09_2022(IdsNo, protocol) {
        try {
            // Check when there isIPQC
            var IPQCObject = globalData.arr_IPQCRelIds.find((k) => k.idsNo == IdsNo);
            var selectedIds;
            var objLotData = globalData.arrLot.find((k) => k.idsNo == IdsNo);

            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var currentCubicle = globalData.arrIdsInfo.find(
                (k) => k.Sys_IDSNo == IdsNo
            );
            var actualProtocol = protocol;
            let now = new Date();
            var protocolValue = protocol.substring(0, 5); // starting 5 character
            var protocolValueData = protocol.substring(6); // starting 5 character
            var protocolIncomingType = protocolValue.substring(0, 1); //Check incoming Protocol is from "T" or "H"
            //var hardnessReading = protocol.substring(0, 7);
            const tempUserObject = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
            var objHardness = globalData.arrHardness425.find(
                (ht) => ht.idsNo == IdsNo
            );
            var productlimits = globalData.arr_limits.find((al) => al.idsNo == IdsNo);
            var objInvalid = globalData.arrBulkInvalid.find((k) => k.idsNo == IdsNo);

            if (protocolValue != "TD000" && protocolValue != "HD000") {
                /**
                 * @description We are here setting TD000 and HD000 to false
                 */
                var tempTDHD = globalData.arrTHHDrepet.find((k) => k.idsNo == IdsNo);
                if (tempTDHD == undefined) {
                    globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 });
                } else {
                    tempTDHD.flag = false;
                    tempTDHD.oc = 0;
                }

                if (protocolValue == 'TD001' || protocolValue == 'HD001') {
                    objHardness.linecnt.push(Number(actualProtocol.split(',')[1]));
                }
                /************************************************************* */
                var IncludeX = actualProtocol.includes("X");
                //console.log("IncludeX", IncludeX);
                if (IncludeX == true) {
                    var receivedProtocol = actualProtocol.replace("X", "").trim().substring(0, actualProtocol.length - 3);
                    const objBulkInvalid = new bulkInvalid();
                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                    objBulkInvalid.invalidObj.HD425.invalid = false;
                    objBulkInvalid.invalidObj.HD425.invalidMsg = "";
                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                } else {
                    IncludeX = false;
                }
                if (IncludeX == true) {
                    //console.log("IncludeX", IncludeX);

                    if (receivedProtocol.includes('mg')) {
                        objHardness.mgcnt = objHardness.mgcnt + 1;
                    }
                    if (receivedProtocol.includes('mm')) {
                        objHardness.mmcnt = objHardness.mmcnt + 1;
                    }
                    if ((receivedProtocol.includes("n") || receivedProtocol.includes("N") ||
                        receivedProtocol.includes("Kp") || receivedProtocol.includes("kp") || receivedProtocol.includes("KP") ||
                        receivedProtocol.includes("kP") || receivedProtocol.includes("Sc") || receivedProtocol.includes("sc") ||
                        receivedProtocol.includes("SC") || receivedProtocol.includes("sC"))) {
                        objHardness.ncnt = objHardness.ncnt + 1;
                    }

                    if (
                        receivedProtocol.includes("mm") &&
                        objHardness.dimensionParam == 0
                    ) {
                        var includeMM = protocolValueData.includes("mm");

                        if (includeMM == true) {

                            objHardness.thicknessVal = protocolValueData.split("mm")[0].trim();

                            if (objHardness.thicknessVal != "--") {
                                // objHardness.thicknessVal=Math.abs(objHardness.thicknessVal)
                                if (isNaN(objHardness.thicknessVal) == true ||
                                    objHardness.thicknessVal.length == 0 ||
                                    objHardness.thicknessVal.includes("+") ||
                                    objHardness.thicknessVal.includes("-")) {
                                    console.log(`${objHardness.thicknessVal} this is invalid`);
                                    objHardness.sampleNo = objHardness.dimensionParam == 0 ? objHardness.sampleNo : objHardness.sampleNo - 1
                                    objHardness.dimensionParam = 0;
                                    objHardness.mgcnt = 0;
                                    objHardness.mmcnt = 0;
                                    objHardness.ncnt = 0;
                                    objHardness.rhcnt = 0;
                                    objHardness.dataValues = [];
                                    var msg = "Invalid String,,,,"
                                    return `${protocolIncomingType}R40${msg}`;
                                }
                            }
                            objHardness.dataValues.push({
                                mmth: protocolValueData.split("mm")[0].trim()
                            });

                            objHardness.thicknessDecimal = 2;

                            objHardness.dimensionParam = 1;
                        }
                    } else if (
                        receivedProtocol.includes("mm") &&
                        objHardness.dimensionParam == 1
                    ) {
                        var includeMM = protocolValueData.includes("mm");
                        if (includeMM == true) {

                            objHardness.dimensionVal = protocolValueData.split("mm")[0].trim();
                            if (objHardness.dimensionVal != "--") {
                                // objHardness.dimensionVal=Math.abs(objHardness.dimensionVal)
                                if (isNaN(objHardness.dimensionVal) == true ||
                                    objHardness.dimensionVal.length == 0 ||
                                    objHardness.dimensionVal.includes("+") ||
                                    objHardness.dimensionVal.includes("-")) {
                                    console.log(`${objHardness.dimensionVal} this is invalid`);
                                    objHardness.sampleNo = objHardness.dimensionParam == 0 ? objHardness.sampleNo : objHardness.sampleNo - 1
                                    objHardness.dimensionParam = 0;
                                    objHardness.mgcnt = 0;
                                    objHardness.mmcnt = 0;
                                    objHardness.ncnt = 0;
                                    objHardness.rhcnt = 0;
                                    objHardness.dataValues = [];
                                    var msg = "Invalid String,,,,"
                                    return `${protocolIncomingType}R40${msg}`;
                                }
                            }

                            if (objHardness.dataValues.length) objHardness.dataValues[objHardness.dataValues.length - 1].mmdimen = protocolValueData.split("mm")[0].trim();
                            // }
                            objHardness.dimensionDecimal = 2; // dimensionVal.split('.').replace(/\D/g, '').length;//count number in given string
                            objHardness.dimensionParam = 2;

                        }
                    } else if (
                        (receivedProtocol.includes("n") || receivedProtocol.includes("N") ||
                            receivedProtocol.includes("Kp") || receivedProtocol.includes("kp") || receivedProtocol.includes("KP") ||
                            receivedProtocol.includes("kP") || receivedProtocol.includes("Sc") || receivedProtocol.includes("sc") ||
                            receivedProtocol.includes("SC") || receivedProtocol.includes("sC")) &&
                        objHardness.dimensionParam == 2
                    ) {
                        var includeNorKp
                        objHardness.dimensionParam = 0;

                        if (receivedProtocol.includes("n") || receivedProtocol.includes("N") ||
                            receivedProtocol.includes("Kp") || receivedProtocol.includes("kp") || receivedProtocol.includes("KP") ||
                            receivedProtocol.includes("kP") || receivedProtocol.includes("Sc") || receivedProtocol.includes("sc") ||
                            receivedProtocol.includes("SC") || receivedProtocol.includes("sC")) {
                            includeNorKp = true
                        }
                        else {
                            includeNorKp = false
                        }
                        if (includeNorKp == true) {

                            var HardnessVal = 0;
                            var HardnessUnit;
                            //var strRecivedProtocol = app.protocolToString(Buffer.from(protocolValueData,'utf8'));
                            var includeUnit = protocolValueData.substring(0, protocolValueData.length - 2).trim();//for non-printable chrecters test
                            if (includeUnit.includes("n") || includeUnit.includes("N")) {
                                HardnessVal = includeUnit.substring(0, includeUnit.length - 1).trim();
                                HardnessUnit = includeUnit.substring(includeUnit.length, HardnessVal.length).trim()

                            }
                            else {
                                HardnessVal = includeUnit.substring(0, includeUnit.length - 2).trim();
                                HardnessUnit = includeUnit.substring(includeUnit.length, HardnessVal.length).trim()
                            }
                            if (HardnessVal != "--") {
                                if (isNaN(HardnessVal) == true ||
                                    HardnessVal.length == 0 ||
                                    HardnessVal.includes("+") ||
                                    HardnessVal.includes("-")) {
                                    console.log(`${HardnessVal} this is invalid`);
                                    objHardness.sampleNo = objHardness.dimensionParam == 0 ? objHardness.sampleNo : objHardness.sampleNo - 1
                                    objHardness.dimensionParam = 0;
                                    objHardness.mgcnt = 0;
                                    objHardness.mmcnt = 0;
                                    objHardness.ncnt = 0;
                                    objHardness.rhcnt = 0;
                                    objHardness.dataValues = [];
                                    var msg = "Invalid String,,,,"
                                    return `${protocolIncomingType}R40${msg}`;
                                }
                            }

                            objHardness.hardnessVal = HardnessVal
                            objHardness.HardnessUnit = HardnessUnit

                            var decimalValue;
                            if (objHardness.hardnessVal.match(/^\d+$/) || objHardness.hardnessVal == "--") {
                                decimalValue = 0;
                            } else {
                                decimalValue = objHardness.hardnessVal.split(".")[1].length
                            }
                            // var decimalValue = objHardness.hardnessVal.match(/^\d+$/) ? 0 : objHardness.hardnessVal.split(".")[1].length
                            objHardness.hardnessDecimal = decimalValue



                            if (objHardness.hardnessVal == "") {
                                objHardness.hardnessVal = "NA";
                            }

                            var isHardnessValid = parseFloat(objHardness.hardnessVal);
                            var isHardnessValid = isHardnessValid.toString();
                            const objBulkInvalid = new bulkInvalid();
                            objBulkInvalid.invalidObj.idsNo = IdsNo;

                            if (objHardness.dataValues.length) {
                                if (objHardness.hardnessVal == "NA") {
                                    objHardness.dataValues[objHardness.dataValues.length - 1].n = 0;
                                } else {
                                    objHardness.dataValues[objHardness.dataValues.length - 1].n = objHardness.hardnessVal;
                                }
                            }


                        }
                        else {
                            return `${protocolIncomingType}R40Invalid String,,,,`;
                        }
                    }
                    return protocolValue;
                } else {
                    return protocolValue;
                }
            } else {
                /**
                 * @description We are here setting TD000 and HD000 to true
                */
                var tempTDHD = globalData.arrTHHDrepet.find((k) => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                console.log(tempTDHD);
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    console.log('=============start=================');
                    console.log(objHardness.mmcnt);
                    console.log(objHardness.mgcnt);
                    console.log(objHardness.ncnt);
                    console.log('=============end===================');

                    var tempLimObj = globalData.arr_limits.find((k) => k.idsNo == IdsNo);
                    var intNos = tempLimObj.Hardness.noOfSamples;

                    if (objHardness.sampleNo <= intNos && !objHardness.movingToComplete) {
                        if (objHardness.hardnessVal == "--" && objHardness.dimensionVal == "--" && objHardness.thicknessVal == "--") {
                            objHardness.mgcnt = 0;
                            objHardness.mmcnt = 0;
                            objHardness.ncnt = 0;
                            // objHardness.linecnt = [];
                            objHardness.dimensionParam = 0;
                            objHardness.rhcnt = 0;
                            objHardness.dataValues = [];
                            return `${protocolIncomingType}R40Invalid String,,,,`;
                        }
                        if ((objHardness.mgcnt == objHardness.ncnt) && (objHardness.mmcnt == (objHardness.ncnt * 2)) &&
                            (objHardness.mgcnt != 0 && objHardness.mmcnt != 0 && objHardness.ncnt != 0)) {

                            objHardness.mgcnt = 0;
                            objHardness.mmcnt = 0;
                            objHardness.ncnt = 0;
                            objHardness.dimensionParam = 0;
                            objHardness.linecnt = [];
                            objHardness.rhcnt = 0;

                            var tempLimObj = globalData.arr_limits.find((k) => k.idsNo == IdsNo);
                            var intNos = tempLimObj.Hardness.noOfSamples;
                            var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                (sr) => sr.idsNo == IdsNo
                            );
                            var objHardness = globalData.arrHardness425.find(
                                (ht) => ht.idsNo == IdsNo
                            );
                            var productObj = globalData.arrIdsInfo.find(
                                (k) => k.Sys_IDSNo == selectedIds
                            );
                            if (!objHardness.isFirstSampleSaved) {
                                let objActivity = {};
                                Object.assign(
                                    objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: "Hardness Weighment Started on IDS" + IdsNo }
                                );
                                await objActivityLog.ActivityLogEntry(objActivity).catch((error) => {
                                    logFromPC.addtoProtocolLog(error, "error");
                                    console.log(error);
                                });
                                var productObj = globalData.arrIdsInfo.find(
                                    (k) => k.Sys_IDSNo == selectedIds
                                );

                                const checkMasterData = {
                                    str_tableName: "tbl_tab_masterhtd_incomplete",
                                    data: "MAX(MstSerNo) AS SeqNo",
                                    condition: [
                                        { str_colName: "BFGCode", value: productObj.Sys_BFGCode, comp: "eq" },
                                        { str_colName: "ProductName", value: productObj.Sys_ProductName, comp: "eq" },
                                        { str_colName: "PVersion", value: productObj.Sys_PVersion, comp: "eq" },
                                        { str_colName: "Version", value: productObj.Sys_Version, comp: "eq" },
                                        { str_colName: "BatchNo", value: productObj.Sys_Batch, comp: "eq" },
                                        { str_colName: "Idsno", value: IdsNo, comp: "eq" },
                                    ],
                                };
                                // console.log("tbl_tab_masterhtd_incomplete  1 :" + checkMasterData);
                                var result = await database.select(checkMasterData);
                                var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                    (sr) => sr.idsNo == IdsNo
                                );
                                var intMstSerNo;
                                if (result[0][0].SeqNo == null) {
                                    intMstSerNo = 1;
                                    objIncompIdHardness.incompRepSerNo = intMstSerNo;
                                } else {
                                    var newMstSerNo = result[0][0].SeqNo + 1;
                                    intMstSerNo = newMstSerNo;
                                    objIncompIdHardness.incompRepSerNo = intMstSerNo;
                                }

                                if (productlimits.Length != undefined) {
                                    objHardness.colName = "Length";
                                    objHardness.opNominal = productlimits.Length.nominal;
                                    objHardness.opNegTol = productlimits.Length.T2Neg;
                                    objHardness.opPosTol = productlimits.Length.T2Pos;
                                } else if (productlimits.Diameter != undefined) {
                                    objHardness.colName = "Diameter";
                                    objHardness.opNominal = productlimits.Diameter.nominal;
                                    objHardness.opNegTol = productlimits.Diameter.T2Neg;
                                    objHardness.opPosTol = productlimits.Diameter.T2Pos;
                                } else {
                                    objHardness.colName = "NA";
                                    objHardness.opNominal = 0;
                                    objHardness.opNegTol = 0;
                                    objHardness.opPosTol = 0;
                                }

                                if (productlimits.Thickness == undefined) {
                                    objHardness.thicknessNom = 0;
                                    objHardness.thicknesneg = 0;
                                    objHardness.thicknespos = 0;
                                } else {
                                    objHardness.thicknessNom =
                                        productlimits.Thickness.nominal;
                                    objHardness.thicknesneg = productlimits.Thickness.T2Neg;
                                    objHardness.thicknespos = productlimits.Thickness.T2Pos;
                                }

                                var side = "NA";
                                if (productObj.Sys_RotaryType == "Single") {
                                    side = "NA";
                                } else {
                                    side = productlimits.Hardness.side == "L" ? "LHS" : "RHS";
                                }

                                await clspowerbackup.insertPowerBackupData(productObj, protocolIncomingType, tempUserObject, IdsNo, "htd", "Erweka TBH-425", "Hardness");
                                var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
                                // var HardnessUnit = "N";
                                var masterIncopleteData = {
                                    str_tableName: "tbl_tab_masterhtd_incomplete",
                                    data: [
                                        { str_colName: "MstSerNo", value: objIncompIdHardness.incompRepSerNo },
                                        { str_colName: "InstruId", value: 1 },
                                        { str_colName: "BFGCode", value: productObj.Sys_BFGCode },
                                        { str_colName: "ProductName", value: productObj.Sys_ProductName },
                                        { str_colName: "ProductType", value: ProductType.productType },
                                        { str_colName: "Idsno", value: IdsNo },
                                        { str_colName: "CubicalNo", value: productObj.Sys_CubicNo },
                                        { str_colName: "BalanceId", value: productObj.Sys_BalID },
                                        { str_colName: "VernierId", value: productObj.Sys_VernierID },
                                        { str_colName: "BatchNo", value: productObj.Sys_Batch },
                                        { str_colName: "UserId", value: tempUserObject.UserId },
                                        { str_colName: "UserName", value: tempUserObject.UserName },
                                        { str_colName: "PrDate", value: date.format(now, "YYYY-MM-DD") },
                                        { str_colName: "PrTime", value: date.format(now, "HH:mm:ss") },
                                        { str_colName: "Side", value: side },
                                        { str_colName: "Qty", value: productlimits.Hardness.noOfSamples },
                                        { str_colName: "Unit", value: objHardness.HardnessUnit },
                                        { str_colName: "CubicleType", value: productObj.Sys_CubType },
                                        { str_colName: "ReportType", value: productObj.Sys_RptType },
                                        { str_colName: "MachineCode", value: productObj.Sys_MachineCode },
                                        { str_colName: "MFGCode", value: productObj.Sys_MfgCode },
                                        { str_colName: "BatchSize", value: productObj.Sys_BatchSize },
                                        { str_colName: "HardnessID", value: currentCubicle.Sys_HardID },
                                        { str_colName: "CubicleName", value: productObj.Sys_dept },
                                        { str_colName: "CubicleLocation", value: productObj.Sys_dept },
                                        { str_colName: "IsArchived", value: 0 },
                                        { str_colName: "PVersion", value: productObj.Sys_PVersion },
                                        { str_colName: "Version", value: productObj.Sys_Version },
                                        { str_colName: "ColHeadDOLOBO", value: objHardness.colName },
                                        { str_colName: "NomThick", value: objHardness.thicknessNom },
                                        { str_colName: "PosTolThick", value: objHardness.thicknespos },
                                        { str_colName: "NegTolThick", value: objHardness.thicknesneg },
                                        { str_colName: "NomHard", value: productlimits.Hardness.nominal },
                                        { str_colName: "PosTolHard", value: productlimits.Hardness.T1Pos },
                                        { str_colName: "NegTolHard", value: productlimits.Hardness.T1Neg },
                                        { str_colName: "NomDOLOBO", value: objHardness.opNominal },
                                        { str_colName: "PosTolDOLOBO", value: objHardness.opPosTol },
                                        { str_colName: "NegTolDOLOBO", value: objHardness.opNegTol },
                                        { str_colName: "GraphType", value: productlimits.Hardness.LimitOn[0] },
                                        { str_colName: "RepoLabel11", value: currentCubicle.Sys_Validation },
                                        { str_colName: "WgmtModeNo", value: 7 },
                                        { str_colName: "Lot", value: objLotData.LotNo },
                                        { str_colName: "Stage", value: productObj.Sys_Stage },
                                        { str_colName: "Area", value: productObj.Sys_Area },
                                        { str_colName: "DecimalPoint", value: objHardness.hardnessDecimal },
                                    ],
                                };

                                var masterSrno = await database.save(masterIncopleteData);

                                var tempObj = globalData.arrIncompleteRemark.find(k => k.IdsNo == IdsNo);
                                if (tempObj == undefined) {
                                    globalData.arrIncompleteRemark.push({ weighment: true, RepoSr: masterSrno[0].insertId, Type: 7, IdsNo: IdsNo });
                                }
                                else {
                                    tempObj.weighment = true;
                                    tempObj.RepoSr = masterSrno[0].insertId;
                                    tempObj.Type = 7;
                                    //globalData.arrIncompleteRemark.IdsNo = IdsNo;
                                }

                                var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                    (sr) => sr.idsNo == IdsNo
                                );
                                var objHardness = globalData.arrHardness425.find(
                                    (ht) => ht.idsNo == IdsNo
                                );
                                objInstrumentUsage.InstrumentUsage("Hardness", IdsNo, "tbl_instrumentlog_hardness", "Hardness", "started");
                                objIncompIdHardness.incompRepSerNo = masterSrno[0].insertId;
                                //console.log("Third",objHardness);

                                const getRepsrNo = {
                                    str_tableName: "tbl_tab_masterhtd_incomplete",
                                    data: "MAX(RepSerNo) AS RepSerNo",
                                    condition: [
                                        { str_colName: "BFGCode", value: productObj.Sys_BFGCode, comp: "eq" },
                                        { str_colName: "ProductName", value: productObj.Sys_ProductName, comp: "eq" },
                                        { str_colName: "PVersion", value: productObj.Sys_PVersion, comp: "eq" },
                                        { str_colName: "Version", value: productObj.Sys_Version, comp: "eq" },
                                        { str_colName: "BatchNo", value: productObj.Sys_Batch, comp: "eq" },
                                        { str_colName: "Idsno", value: IdsNo, comp: "eq" },
                                    ],
                                };


                                var res = await database.select(getRepsrNo);
                                let objUpdatepowerbackup = {
                                    str_tableName: "tbl_powerbackup",
                                    data: [
                                        { str_colName: "Incomp_RepSerNo", value: res[0][0].RepSerNo },
                                    ],
                                    condition: [
                                        { str_colName: "Idsno", value: IdsNo },
                                        { str_colName: "Sys_BFGCode", value: productObj.Sys_BFGCode },
                                        { str_colName: "Sys_Batch", value: productObj.Sys_Batch },
                                    ],
                                };
                                await database.update(objUpdatepowerbackup);
                                await objRemarkInComplete.updateEntry(IdsNo, 'Hardness');
                                for (let i = 0; i < objHardness.dataValues.length; i++) {
                                    const insertDetailObj = {
                                        str_tableName: "tbl_tab_detailhtd_incomplete",
                                        data: [
                                            { str_colName: "RepSerNo", value: objIncompIdHardness.incompRepSerNo },
                                            { str_colName: "MstSerNo", value: 0 },
                                            { str_colName: "RecSeqNo", value: i + 1 },
                                            { str_colName: "DataValueThick", value: objHardness.thicknessNom == 0 ? 0 : objHardness.dataValues[i].mmth },
                                            { str_colName: "DataValueDOLOBO", value: objHardness.opNominal == 0 ? 0 : objHardness.dataValues[i].mmdimen },
                                            { str_colName: "DataValueHard", value: objHardness.dataValues[i].n },
                                            { str_colName: "DecimalPointThick", value: objHardness.thicknessNom == 0 ? 0 : objHardness.thicknessDecimal },
                                            { str_colName: "DecimalPointDOLOBO", value: objHardness.opNominal == 0 ? 0 : objHardness.dimensionDecimal },
                                            { str_colName: "DecimalPointHard", value: objHardness.hardnessDecimal },
                                            { str_colName: "idsNo", value: parseInt(objHardness.idsNo) },
                                        ],
                                    };
                                    await database.save(insertDetailObj);
                                    objHardness.sampleNo = i + 1;

                                    if (objHardness.sampleNo == intNos) {
                                        // breaking loop because instrument is sending extra sample
                                        break;
                                    }
                                }

                                //  objHardness.sampleNo = objHardness.dataValues.length;
                                //crearing array to receive more samples

                                objHardness.dataValues = [];

                                var tempObj = globalData.arrIncompleteRemark.find(
                                    (k) => k.IdsNo == IdsNo
                                );
                                if (tempObj == undefined) {
                                    globalData.arrIncompleteRemark.push({
                                        weighment: true,
                                        RepoSr: masterSrno[0].insertId,
                                        Type: 7,
                                        IdsNo: IdsNo,
                                    });
                                } else {
                                    tempObj.weighment = true;
                                    tempObj.RepoSr = masterSrno[0].insertId;
                                    tempObj.Type = 7;
                                    //globalData.arrIncompleteRemark.IdsNo = IdsNo;
                                }
                                objHardness.isFirstSampleSaved = true;
                            } else {
                                if (objHardness.sampleNo > 0) {
                                    var objHardness = globalData.arrHardness425.find(
                                        (ht) => ht.idsNo == IdsNo
                                    );
                                    var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                        (sr) => sr.idsNo == IdsNo
                                    );


                                    let tempRecNo = objHardness.sampleNo + 1;
                                    for (let i = 0; i < objHardness.dataValues.length; i++) {
                                        const insertDetailObj = {
                                            str_tableName: "tbl_tab_detailhtd_incomplete",
                                            data: [
                                                { str_colName: "RepSerNo", value: objIncompIdHardness.incompRepSerNo },
                                                { str_colName: "MstSerNo", value: 0 },
                                                { str_colName: "RecSeqNo", value: tempRecNo },
                                                { str_colName: "DataValueThick", value: objHardness.thicknessNom == 0 ? 0 : objHardness.dataValues[i].mmth },
                                                { str_colName: "DataValueDOLOBO", value: objHardness.opNominal == 0 ? 0 : objHardness.dataValues[i].mmdimen },
                                                { str_colName: "DataValueHard", value: objHardness.dataValues[i].n },
                                                { str_colName: "DecimalPointThick", value: objHardness.thicknessNom == 0 ? 0 : objHardness.thicknessDecimal },
                                                { str_colName: "DecimalPointDOLOBO", value: objHardness.opNominal == 0 ? 0 : objHardness.dimensionDecimal },
                                                { str_colName: "DecimalPointHard", value: objHardness.hardnessDecimal },
                                                { str_colName: "idsNo", value: parseInt(objHardness.idsNo) },
                                            ],
                                        };
                                        await database.save(insertDetailObj);
                                        if (tempRecNo == intNos) {
                                            // breaking loop because instrument is sending extra sample
                                            break;
                                        }
                                        if (i != objHardness.dataValues.length - 1) {
                                            tempRecNo = tempRecNo + 1;
                                        }


                                    }
                                    objHardness.sampleNo = tempRecNo;
                                    objHardness.dataValues = [];
                                }
                            }

                            // if we reach to last sample move data to complete
                            // otherwise send how many samples received to IDS
                            if (objHardness.sampleNo >= intNos) {
                                //console.log(globalData.hardnessIncompleteId);
                                objHardness.moveToComplete = true;
                                await hardnessData.saveHardnessData(
                                    objIncompIdHardness.incompRepSerNo,
                                    IdsNo
                                );
                                //  await new Promise(function (resolve,reject) {
                                //     setTimeout(() => {
                                //        console.log('making wait');
                                //        resolve('ok');
                                //     },13000);
                                //  });
                                // Clear flag for Incomplete remark on weighment complete like (test aborted, balance off, Auto logout);
                                if (globalData.arrIncompleteRemark != undefined) {
                                    globalData.arrIncompleteRemark = globalData.arrIncompleteRemark.filter(
                                        (k) => k.IdsNo != IdsNo
                                    );
                                }
                                var selectedIds;
                                var IPQCObject = globalData.arr_IPQCRelIds.find(
                                    (k) => k.idsNo == IdsNo
                                );
                                if (IPQCObject != undefined) {
                                    selectedIds = IPQCObject.selectedIds;
                                } else {
                                    selectedIds = IdsNo;
                                }
                                var objUpdateValidation = {
                                    str_tableName: "tbl_cubical",
                                    data: [{ str_colName: "Sys_Validation", value: 0 }],
                                    condition: [{ str_colName: "Sys_IDSNo", value: selectedIds }],
                                };

                                await database.update(objUpdateValidation);
                                let objActivity = {};
                                Object.assign(
                                    objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: "Hardness Weighment Completed on IDS" + IdsNo }
                                );
                                await objActivityLog.ActivityLogEntry(objActivity);
                                objHardness.sampleNo = 0;
                                var response = `${protocolIncomingType}R3,,,,,`;
                                objInstrumentUsage.InstrumentUsage("Hardness", IdsNo, "tbl_instrumentlog_hardness", "", "completed");
                                objMonitor.monit({
                                    case: "BL",
                                    idsNo: IdsNo,
                                    data: { test: "HARDNESS", flag: "COMPLETED" },
                                });
                                objHardness.isFirstSampleSaved = false;
                                return response;
                            } else {
                                // var response = `${protocolIncomingType}R3,,,,,`;
                                //HR0<>,<>,<>,<>,<>,
                                var HRDProtocol = `${protocolIncomingType}R0` +
                                    objHardness.sampleNo +
                                    " Samples Received,,,,,";
                                return HRDProtocol;
                            }

                        } else if (objHardness.rhcnt == 0) {
                            objHardness.mgcnt = 0;
                            objHardness.mmcnt = 0;
                            objHardness.ncnt = 0;
                            // objHardness.linecnt = [];
                            objHardness.dimensionParam = 0;
                            objHardness.rhcnt = 1;
                            objHardness.dataValues = [];
                            return 'R' + protocolIncomingType;
                        } else if (objHardness.rhcnt >= 1) {
                            objHardness.mgcnt = 0;
                            objHardness.mmcnt = 0;
                            objHardness.ncnt = 0;
                            objHardness.dimensionParam = 0;
                            objHardness.linecnt = [];
                            objHardness.rhcnt = 0;
                            console.log(objHardness);
                            // now filtering dataValues because some data can be missing
                            var tempLimObj = globalData.arr_limits.find((k) => k.idsNo == IdsNo);
                            var intNos = tempLimObj.Hardness.noOfSamples;
                            objHardness.dataValues = objHardness.dataValues.filter((dataObj) => {
                                return (dataObj.mmth && dataObj.mmdimen && dataObj.n)
                            });

                            if (objHardness.dataValues.length == 0) {
                                return `${protocolIncomingType}R40Invalid String,,,,`;
                            } else {

                                if (!objHardness.isFirstSampleSaved) {
                                    let objActivity = {};
                                    Object.assign(
                                        objActivity,
                                        { strUserId: tempUserObject.UserId },
                                        { strUserName: tempUserObject.UserName },
                                        { activity: "Hardness Weighment Started on IDS" + IdsNo }
                                    );
                                    await objActivityLog
                                        .ActivityLogEntry(objActivity)
                                        .catch((error) => {
                                            logFromPC.addtoProtocolLog(error, "error");
                                            console.log(error);
                                        });
                                    var productObj = globalData.arrIdsInfo.find(
                                        (k) => k.Sys_IDSNo == selectedIds
                                    );

                                    const checkMasterData = {
                                        str_tableName: "tbl_tab_masterhtd_incomplete",
                                        data: "MAX(MstSerNo) AS SeqNo",
                                        condition: [
                                            { str_colName: "BFGCode", value: productObj.Sys_BFGCode, comp: "eq" },
                                            { str_colName: "ProductName", value: productObj.Sys_ProductName, comp: "eq" },
                                            { str_colName: "PVersion", value: productObj.Sys_PVersion, comp: "eq" },
                                            { str_colName: "Version", value: productObj.Sys_Version, comp: "eq" },
                                            { str_colName: "BatchNo", value: productObj.Sys_Batch, comp: "eq" },
                                            { str_colName: "Idsno", value: IdsNo, comp: "eq" },
                                        ],
                                    };
                                    // console.log("tbl_tab_masterhtd_incomplete  1 :" + checkMasterData);
                                    var result = await database.select(checkMasterData);
                                    var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                        (sr) => sr.idsNo == IdsNo
                                    );
                                    var intMstSerNo;
                                    if (result[0][0].SeqNo == null) {
                                        intMstSerNo = 1;
                                        objIncompIdHardness.incompRepSerNo = intMstSerNo;
                                    } else {
                                        var newMstSerNo = result[0][0].SeqNo + 1;
                                        intMstSerNo = newMstSerNo;
                                        objIncompIdHardness.incompRepSerNo = intMstSerNo;
                                    }

                                    if (productlimits.Length != undefined) {
                                        objHardness.colName = "Length";
                                        objHardness.opNominal = productlimits.Length.nominal;
                                        objHardness.opNegTol = productlimits.Length.T2Neg;
                                        objHardness.opPosTol = productlimits.Length.T2Pos;
                                    } else if (productlimits.Diameter != undefined) {
                                        objHardness.colName = "Diameter";
                                        objHardness.opNominal = productlimits.Diameter.nominal;
                                        objHardness.opNegTol = productlimits.Diameter.T2Neg;
                                        objHardness.opPosTol = productlimits.Diameter.T2Pos;
                                    } else {
                                        objHardness.colName = "NA";
                                        objHardness.opNominal = 0;
                                        objHardness.opNegTol = 0;
                                        objHardness.opPosTol = 0;
                                    }

                                    if (productlimits.Thickness == undefined) {
                                        objHardness.thicknessNom = 0;
                                        objHardness.thicknesneg = 0;
                                        objHardness.thicknespos = 0;
                                    } else {
                                        objHardness.thicknessNom =
                                            productlimits.Thickness.nominal;
                                        objHardness.thicknesneg = productlimits.Thickness.T2Neg;
                                        objHardness.thicknespos = productlimits.Thickness.T2Pos;
                                    }

                                    var side = "NA";
                                    if (productObj.Sys_RotaryType == "Single") {
                                        side = "NA";
                                    } else {
                                        side = productlimits.Hardness.side == "L" ? "LHS" : "RHS";
                                    }

                                    await clspowerbackup.insertPowerBackupData(
                                        productObj,
                                        protocolIncomingType,
                                        tempUserObject,
                                        IdsNo,
                                        "htd",
                                        "Erweka TBH-425",
                                        "Hardness"
                                    );
                                    var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
                                    var HardnessUnit = "N";
                                    var masterIncopleteData = {
                                        str_tableName: "tbl_tab_masterhtd_incomplete",
                                        data: [
                                            { str_colName: "MstSerNo", value: objIncompIdHardness.incompRepSerNo },
                                            { str_colName: "InstruId", value: 1 },
                                            { str_colName: "BFGCode", value: productObj.Sys_BFGCode },
                                            { str_colName: "ProductName", value: productObj.Sys_ProductName },
                                            { str_colName: "ProductType", value: ProductType.productType },
                                            { str_colName: "Idsno", value: IdsNo },
                                            { str_colName: "CubicalNo", value: productObj.Sys_CubicNo },
                                            { str_colName: "BalanceId", value: productObj.Sys_BalID },
                                            { str_colName: "VernierId", value: productObj.Sys_VernierID },
                                            { str_colName: "BatchNo", value: productObj.Sys_Batch },
                                            { str_colName: "UserId", value: tempUserObject.UserId },
                                            { str_colName: "UserName", value: tempUserObject.UserName },
                                            { str_colName: "PrDate", value: date.format(now, "YYYY-MM-DD") },
                                            { str_colName: "PrTime", value: date.format(now, "HH:mm:ss") },
                                            { str_colName: "Side", value: side },
                                            { str_colName: "Qty", value: productlimits.Hardness.noOfSamples },
                                            { str_colName: "Unit", value: HardnessUnit },
                                            { str_colName: "CubicleType", value: productObj.Sys_CubType },
                                            { str_colName: "ReportType", value: productObj.Sys_RptType },
                                            { str_colName: "MachineCode", value: productObj.Sys_MachineCode },
                                            { str_colName: "MFGCode", value: productObj.Sys_MfgCode },
                                            { str_colName: "BatchSize", value: productObj.Sys_BatchSize },
                                            { str_colName: "HardnessID", value: currentCubicle.Sys_HardID },
                                            { str_colName: "CubicleName", value: productObj.Sys_dept },
                                            { str_colName: "CubicleLocation", value: productObj.Sys_dept },
                                            { str_colName: "IsArchived", value: 0 },
                                            { str_colName: "PVersion", value: productObj.Sys_PVersion },
                                            { str_colName: "Version", value: productObj.Sys_Version },
                                            { str_colName: "ColHeadDOLOBO", value: objHardness.colName },
                                            { str_colName: "NomThick", value: objHardness.thicknessNom },
                                            { str_colName: "PosTolThick", value: objHardness.thicknespos },
                                            { str_colName: "NegTolThick", value: objHardness.thicknesneg },
                                            { str_colName: "NomHard", value: productlimits.Hardness.nominal },
                                            { str_colName: "PosTolHard", value: productlimits.Hardness.T1Pos },
                                            { str_colName: "NegTolHard", value: productlimits.Hardness.T1Neg },
                                            { str_colName: "NomDOLOBO", value: objHardness.opNominal },
                                            { str_colName: "PosTolDOLOBO", value: objHardness.opPosTol },
                                            { str_colName: "NegTolDOLOBO", value: objHardness.opNegTol },
                                            { str_colName: "GraphType", value: productlimits.Hardness.LimitOn[0] },
                                            { str_colName: "RepoLabel11", value: currentCubicle.Sys_Validation },
                                            { str_colName: "WgmtModeNo", value: 7 },
                                            { str_colName: "Lot", value: objLotData.LotNo },
                                            { str_colName: "Stage", value: productObj.Sys_Stage },
                                            { str_colName: "DecimalPoint", value: objHardness.hardnessDecimal },
                                        ],
                                    };

                                    var masterSrno = await database.save(masterIncopleteData);

                                    var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                        (sr) => sr.idsNo == IdsNo
                                    );
                                    var objHardness = globalData.arrHardness425.find(
                                        (ht) => ht.idsNo == IdsNo
                                    );
                                    objInstrumentUsage.InstrumentUsage("Hardness", IdsNo, "tbl_instrumentlog_hardness", "Hardness", "started");
                                    objIncompIdHardness.incompRepSerNo = masterSrno[0].insertId;
                                    //console.log("Third",objHardness);

                                    const getRepsrNo = {
                                        str_tableName: "tbl_tab_masterhtd_incomplete",
                                        data: "MAX(RepSerNo) AS RepSerNo",
                                        condition: [
                                            { str_colName: "BFGCode", value: productObj.Sys_BFGCode, comp: "eq" },
                                            { str_colName: "ProductName", value: productObj.Sys_ProductName, comp: "eq" },
                                            { str_colName: "PVersion", value: productObj.Sys_PVersion, comp: "eq" },
                                            { str_colName: "Version", value: productObj.Sys_Version, comp: "eq" },
                                            { str_colName: "BatchNo", value: productObj.Sys_Batch, comp: "eq" },
                                            { str_colName: "Idsno", value: IdsNo, comp: "eq" },
                                        ],
                                    };


                                    var res = await database.select(getRepsrNo);
                                    let objUpdatepowerbackup = {
                                        str_tableName: "tbl_powerbackup",
                                        data: [
                                            { str_colName: "Incomp_RepSerNo", value: res[0][0].RepSerNo },
                                        ],
                                        condition: [
                                            { str_colName: "Idsno", value: IdsNo },
                                            { str_colName: "Sys_BFGCode", value: productObj.Sys_BFGCode },
                                            { str_colName: "Sys_Batch", value: productObj.Sys_Batch },
                                        ],
                                    };
                                    await database.update(objUpdatepowerbackup);

                                    for (let i = 0; i < objHardness.dataValues.length; i++) {
                                        const insertDetailObj = {
                                            str_tableName: "tbl_tab_detailhtd_incomplete",
                                            data: [
                                                { str_colName: "RepSerNo", value: objIncompIdHardness.incompRepSerNo },
                                                { str_colName: "MstSerNo", value: 0 },
                                                { str_colName: "RecSeqNo", value: i + 1 },
                                                { str_colName: "DataValueThick", value: objHardness.thicknessNom == 0 ? 0 : objHardness.dataValues[i].mmth },
                                                { str_colName: "DataValueDOLOBO", value: objHardness.opNominal == 0 ? 0 : objHardness.dataValues[i].mmdimen },
                                                { str_colName: "DataValueHard", value: objHardness.dataValues[i].n },
                                                { str_colName: "DecimalPointThick", value: objHardness.thicknessNom == 0 ? 0 : objHardness.thicknessDecimal },
                                                { str_colName: "DecimalPointDOLOBO", value: objHardness.opNominal == 0 ? 0 : objHardness.dimensionDecimal },
                                                { str_colName: "DecimalPointHard", value: objHardness.hardnessDecimal },
                                                { str_colName: "idsNo", value: parseInt(objHardness.idsNo) },
                                            ],
                                        };

                                        await database.save(insertDetailObj);
                                        objHardness.sampleNo = i + 1;

                                        if (objHardness.sampleNo == intNos) {
                                            // breaking loop because instrument is sending extra sample
                                            break;
                                        }
                                    }

                                    //    objHardness.sampleNo = objHardness.dataValues.length;
                                    //creating array to receive more samples

                                    objHardness.dataValues = [];

                                    var tempObj = globalData.arrIncompleteRemark.find(
                                        (k) => k.IdsNo == IdsNo
                                    );
                                    if (tempObj == undefined) {
                                        globalData.arrIncompleteRemark.push({
                                            weighment: true,
                                            RepoSr: masterSrno[0].insertId,
                                            Type: 7,
                                            IdsNo: IdsNo,
                                        });
                                    } else {
                                        tempObj.weighment = true;
                                        tempObj.RepoSr = masterSrno[0].insertId;
                                        tempObj.Type = 7;
                                        //globalData.arrIncompleteRemark.IdsNo = IdsNo;
                                    }
                                    objHardness.isFirstSampleSaved = true;
                                } else {
                                    if (objHardness.sampleNo > 0) {
                                        var objHardness = globalData.arrHardness425.find(
                                            (ht) => ht.idsNo == IdsNo
                                        );
                                        var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                            (sr) => sr.idsNo == IdsNo
                                        );


                                        let tempRecNo = objHardness.sampleNo + 1;
                                        for (let i = 0; i < objHardness.dataValues.length; i++) {
                                            const insertDetailObj = {
                                                str_tableName: "tbl_tab_detailhtd_incomplete",
                                                data: [
                                                    { str_colName: "RepSerNo", value: objIncompIdHardness.incompRepSerNo },
                                                    { str_colName: "MstSerNo", value: 0 },
                                                    { str_colName: "RecSeqNo", value: tempRecNo },
                                                    { str_colName: "DataValueThick", value: objHardness.thicknessNom == 0 ? 0 : objHardness.dataValues[i].mmth },
                                                    { str_colName: "DataValueDOLOBO", value: objHardness.opNominal == 0 ? 0 : objHardness.dataValues[i].mmdimen },
                                                    { str_colName: "DataValueHard", value: objHardness.dataValues[i].n },
                                                    { str_colName: "DecimalPointThick", value: objHardness.thicknessNom == 0 ? 0 : objHardness.thicknessDecimal },
                                                    { str_colName: "DecimalPointDOLOBO", value: objHardness.opNominal == 0 ? 0 : objHardness.dimensionDecimal },
                                                    { str_colName: "DecimalPointHard", value: objHardness.hardnessDecimal },
                                                    { str_colName: "idsNo", value: parseInt(objHardness.idsNo) },
                                                ],
                                            };
                                            await database.save(insertDetailObj);
                                            if (tempRecNo == intNos) {
                                                // breaking loop because instrument is sending extra sample
                                                break;
                                            }
                                            if (i != objHardness.dataValues.length - 1) {
                                                tempRecNo = tempRecNo + 1;
                                            }

                                        }
                                        objHardness.sampleNo = tempRecNo;
                                        objHardness.dataValues = [];
                                    }
                                }
                                // if we reach to last sample move data to complete
                                // otherwise send how many samples received to IDS
                                if (objHardness.sampleNo >= intNos) {
                                    //console.log(globalData.hardnessIncompleteId);
                                    objHardness.moveToComplete = true;
                                    await hardnessData.saveHardnessData(
                                        objIncompIdHardness.incompRepSerNo,
                                        IdsNo
                                    );
                                    //  await new Promise(function(resolve,reject) {
                                    //     setTimeout(() => {
                                    //        console.log('making wait');
                                    //        resolve('ok');
                                    //     },13000);
                                    //  });
                                    // Clear flag for Incomplete remark on weighment complete like (test aborted, balance off, Auto logout);
                                    if (globalData.arrIncompleteRemark != undefined) {
                                        globalData.arrIncompleteRemark = globalData.arrIncompleteRemark.filter(
                                            (k) => k.IdsNo != IdsNo
                                        );
                                    }
                                    var selectedIds;
                                    var IPQCObject = globalData.arr_IPQCRelIds.find(
                                        (k) => k.idsNo == IdsNo
                                    );
                                    if (IPQCObject != undefined) {
                                        selectedIds = IPQCObject.selectedIds;
                                    } else {
                                        selectedIds = IdsNo;
                                    }
                                    var objUpdateValidation = {
                                        str_tableName: "tbl_cubical",
                                        data: [{ str_colName: "Sys_Validation", value: 0 }],
                                        condition: [{ str_colName: "Sys_IDSNo", value: selectedIds }],
                                    };

                                    await database.update(objUpdateValidation);
                                    let objActivity = {};
                                    Object.assign(
                                        objActivity,
                                        { strUserId: tempUserObject.UserId },
                                        { strUserName: tempUserObject.UserName },
                                        { activity: "Hardness Weighment Completed on IDS" + IdsNo }
                                    );
                                    await objActivityLog.ActivityLogEntry(objActivity);
                                    objHardness.sampleNo = 0;
                                    var response = `${protocolIncomingType}R3,,,,,`;
                                    objInstrumentUsage.InstrumentUsage(
                                        "Hardness",
                                        IdsNo,
                                        "tbl_instrumentlog_hardness",
                                        "",
                                        "completed"
                                    );
                                    objMonitor.monit({
                                        case: "BL",
                                        idsNo: IdsNo,
                                        data: { test: "HARDNESS", flag: "COMPLETED" },
                                    });
                                    objHardness.isFirstSampleSaved = false;
                                    return response;
                                } else {
                                    var HRDProtocol =
                                        `${protocolIncomingType}R0` + objHardness.sampleNo +
                                        " Samples Received,,,,,";
                                    return HRDProtocol;
                                }
                            }
                        }

                    }


                } else {
                    console.log("REPEAT_COUNT FOR TDHD000");
                    return "+";
                }

            }
        } catch (err) {
            console.log(err);
        }
    }

    async insertBulkWeighmentHardness_425Lan_old(data, IdsNo) {
        // Check when there isIPQC
        var IPQCObject = globalData.arr_IPQCRelIds.find((k) => k.idsNo == IdsNo);
        var selectedIds;
        var objLotData = globalData.arrLot.find((k) => k.idsNo == IdsNo);

        if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds;
        } else {
            selectedIds = IdsNo;
        }
        var currentCubicle = globalData.arrIdsInfo.find(
            (k) => k.Sys_IDSNo == IdsNo
        );
        //var hardnessReading = protocol.substring(0, 7);
        const tempUserObject = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
        var objHardness = globalData.arrHardness425.find(
            (ht) => ht.idsNo == IdsNo
        );
        var productlimits = globalData.arr_limits.find((al) => al.idsNo == IdsNo);
        var intNos = productlimits.Hardness.noOfSamples;

        var parseThickness = false, parseDimension = false, parseHardness = false, sampleParsed;
        let dataInLines = data.split('X').filter(str => str.length);  // to remove empty strings

        let dataValueObj = {};
        for (let i = 0; i < dataInLines.length; i++) {
            let sampleStr = dataInLines[i];

            if (sampleStr.includes('mg')) {
                parseThickness = true;
            } else if (sampleStr.includes('mm') && parseThickness == true) {
                dataValueObj.thickness = sampleStr.replace('mm', '').trim();
                parseThickness = false;
                parseDimension = true;
            } else if (sampleStr.includes('mm') && parseDimension == true) {
                dataValueObj.dimension = sampleStr.replace('mm', '').trim();
                parseDimension = false;

            } else if (sampleStr.includes('N') && parseDimension == false && parseThickness == false) {
                dataValueObj.hardness = sampleStr.split(' ').filter(s => s.length)[0].trim();

                let validData;
                if (dataValueObj.thickness && dataValueObj.dimension && dataValueObj.hardness) {
                    validData = true;
                } else validData = false;
                if (validData == true) {
                    //    objHardness.sampleNo = objHardness.sampleNo + 1;

                    // validation ========================
                    let isInvalisString = false;
                    let hardness = dataValueObj.hardness;
                    let thickness = dataValueObj.thickness;
                    let dimension = dataValueObj.dimension;
                    if ((hardness != '--') && (isNaN(Number(hardness)))) {
                        isInvalisString = true;
                    }
                    if ((thickness != '--') && (isNaN(Number(thickness)))) {
                        isInvalisString = true;
                    }
                    if ((dimension != '--') && (isNaN(Number(dimension)))) {
                        isInvalisString = true;
                    }

                    if (isInvalisString) {
                        dataValueObj = {};
                        return `${objHardness.protocolIncomingType}R40Invalid String,,,,`;
                    }




                    if ((objHardness.sampleNo + 1) == 1) {
                        let objActivity = {};
                        Object.assign(
                            objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: "Hardness Weighment Started on IDS" + IdsNo }
                        );
                        await objActivityLog.ActivityLogEntry(objActivity).catch((error) => {
                            logFromPC.addtoProtocolLog(error, "error");
                            console.log(error);
                        });
                        var productObj = globalData.arrIdsInfo.find(
                            (k) => k.Sys_IDSNo == selectedIds
                        );

                        const checkMasterData = {
                            str_tableName: "tbl_tab_masterhtd_incomplete",
                            data: "MAX(MstSerNo) AS SeqNo",
                            condition: [
                                { str_colName: "BFGCode", value: productObj.Sys_BFGCode, comp: "eq" },
                                { str_colName: "ProductName", value: productObj.Sys_ProductName, comp: "eq" },
                                { str_colName: "PVersion", value: productObj.Sys_PVersion, comp: "eq" },
                                { str_colName: "Version", value: productObj.Sys_Version, comp: "eq" },
                                { str_colName: "BatchNo", value: productObj.Sys_Batch, comp: "eq" },
                                { str_colName: "Idsno", value: IdsNo, comp: "eq" },
                            ],
                        };
                        // console.log("tbl_tab_masterhtd_incomplete  1 :" + checkMasterData);
                        var result = await database.select(checkMasterData);
                        var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                            (sr) => sr.idsNo == IdsNo
                        );
                        var intMstSerNo;
                        if (result[0][0].SeqNo == null) {
                            intMstSerNo = 1;
                            objIncompIdHardness.incompRepSerNo = intMstSerNo;
                        } else {
                            var newMstSerNo = result[0][0].SeqNo + 1;
                            intMstSerNo = newMstSerNo;
                            objIncompIdHardness.incompRepSerNo = intMstSerNo;
                        }

                        if (productlimits.Length != undefined) {
                            objHardness.colName = "Length";
                            objHardness.opNominal = productlimits.Length.nominal;
                            objHardness.opNegTol = productlimits.Length.T2Neg;
                            objHardness.opPosTol = productlimits.Length.T2Pos;
                        } else if (productlimits.Diameter != undefined) {
                            objHardness.colName = "Diameter";
                            objHardness.opNominal = productlimits.Diameter.nominal;
                            objHardness.opNegTol = productlimits.Diameter.T2Neg;
                            objHardness.opPosTol = productlimits.Diameter.T2Pos;
                        } else {
                            objHardness.colName = "NA";
                            objHardness.opNominal = 0;
                            objHardness.opNegTol = 0;
                            objHardness.opPosTol = 0;
                        }

                        if (productlimits.Thickness == undefined) {
                            objHardness.thicknessNom = 0;
                            objHardness.thicknesneg = 0;
                            objHardness.thicknespos = 0;
                        } else {
                            objHardness.thicknessNom =
                                productlimits.Thickness.nominal;
                            objHardness.thicknesneg = productlimits.Thickness.T2Neg;
                            objHardness.thicknespos = productlimits.Thickness.T2Pos;
                        }

                        var side = "NA";
                        if (productObj.Sys_RotaryType == "Single") {
                            side = "NA";
                        } else {
                            side = productlimits.Hardness.side == "L" ? "LHS" : "RHS";
                        }

                        await clspowerbackup.insertPowerBackupData(productObj, objHardness.protocolIncomingType, tempUserObject, IdsNo, "htd", "Erweka TBH-425", "Hardness");
                        await objRemarkInComplete.updateEntry(IdsNo, 'Hardness');
                        var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
                        var HardnessUnit = "N";
                        let now = new Date();
                        var masterIncopleteData = {
                            str_tableName: "tbl_tab_masterhtd_incomplete",
                            data: [
                                { str_colName: "MstSerNo", value: objIncompIdHardness.incompRepSerNo },
                                { str_colName: "InstruId", value: 1 },
                                { str_colName: "BFGCode", value: productObj.Sys_BFGCode },
                                { str_colName: "ProductName", value: productObj.Sys_ProductName },
                                { str_colName: "ProductType", value: ProductType.productType },
                                { str_colName: "Idsno", value: IdsNo },
                                { str_colName: "CubicalNo", value: productObj.Sys_CubicNo },
                                { str_colName: "BalanceId", value: productObj.Sys_BalID },
                                { str_colName: "VernierId", value: productObj.Sys_VernierID },
                                { str_colName: "BatchNo", value: productObj.Sys_Batch },
                                { str_colName: "UserId", value: tempUserObject.UserId },
                                { str_colName: "UserName", value: tempUserObject.UserName },
                                { str_colName: "PrDate", value: date.format(now, "YYYY-MM-DD") },
                                { str_colName: "PrTime", value: date.format(now, "HH:mm:ss") },
                                { str_colName: "Side", value: side },
                                { str_colName: "Qty", value: productlimits.Hardness.noOfSamples },
                                { str_colName: "Unit", value: HardnessUnit },
                                { str_colName: "CubicleType", value: productObj.Sys_CubType },
                                { str_colName: "ReportType", value: productObj.Sys_RptType },
                                { str_colName: "MachineCode", value: productObj.Sys_MachineCode },
                                { str_colName: "MFGCode", value: productObj.Sys_MfgCode },
                                { str_colName: "BatchSize", value: productObj.Sys_BatchSize },
                                { str_colName: "HardnessID", value: currentCubicle.Sys_HardID },
                                { str_colName: "CubicleName", value: productObj.Sys_dept },
                                { str_colName: "CubicleLocation", value: productObj.Sys_dept },
                                { str_colName: "IsArchived", value: 0 },
                                { str_colName: "PVersion", value: productObj.Sys_PVersion },
                                { str_colName: "Version", value: productObj.Sys_Version },
                                { str_colName: "ColHeadDOLOBO", value: objHardness.colName },
                                { str_colName: "NomThick", value: objHardness.thicknessNom },
                                { str_colName: "PosTolThick", value: objHardness.thicknespos },
                                { str_colName: "NegTolThick", value: objHardness.thicknesneg },
                                { str_colName: "NomHard", value: productlimits.Hardness.nominal },
                                { str_colName: "PosTolHard", value: productlimits.Hardness.T1Pos },
                                { str_colName: "NegTolHard", value: productlimits.Hardness.T1Neg },
                                { str_colName: "NomDOLOBO", value: objHardness.opNominal },
                                { str_colName: "PosTolDOLOBO", value: objHardness.opPosTol },
                                { str_colName: "NegTolDOLOBO", value: objHardness.opNegTol },
                                { str_colName: "GraphType", value: productlimits.Hardness.LimitOn[0] },
                                { str_colName: "RepoLabel11", value: currentCubicle.Sys_Validation },
                                { str_colName: "WgmtModeNo", value: 7 },
                                { str_colName: "Lot", value: objLotData.LotNo },
                                { str_colName: "Stage", value: productObj.Sys_Stage },
                            ],
                        };

                        var masterSrno = await database.save(masterIncopleteData);

                        var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                            (sr) => sr.idsNo == IdsNo
                        );
                        var objHardness = globalData.arrHardness425.find(
                            (ht) => ht.idsNo == IdsNo
                        );
                        objInstrumentUsage.InstrumentUsage("Hardness", IdsNo, "tbl_instrumentlog_hardness", "Hardness", "started");
                        objIncompIdHardness.incompRepSerNo = masterSrno[0].insertId;
                        //console.log("Third",objHardness);

                        const getRepsrNo = {
                            str_tableName: "tbl_tab_masterhtd_incomplete",
                            data: "MAX(RepSerNo) AS RepSerNo",
                            condition: [
                                { str_colName: "BFGCode", value: productObj.Sys_BFGCode, comp: "eq" },
                                { str_colName: "ProductName", value: productObj.Sys_ProductName, comp: "eq" },
                                { str_colName: "PVersion", value: productObj.Sys_PVersion, comp: "eq" },
                                { str_colName: "Version", value: productObj.Sys_Version, comp: "eq" },
                                { str_colName: "BatchNo", value: productObj.Sys_Batch, comp: "eq" },
                                { str_colName: "Idsno", value: IdsNo, comp: "eq" },
                            ],
                        };


                        var res = await database.select(getRepsrNo);
                        let objUpdatepowerbackup = {
                            str_tableName: "tbl_powerbackup",
                            data: [
                                { str_colName: "Incomp_RepSerNo", value: res[0][0].RepSerNo },
                            ],
                            condition: [
                                { str_colName: "Idsno", value: IdsNo },
                                { str_colName: "Sys_BFGCode", value: productObj.Sys_BFGCode },
                                { str_colName: "Sys_Batch", value: productObj.Sys_Batch },
                            ],
                        };
                        await database.update(objUpdatepowerbackup);

                        const insertDetailObj = {
                            str_tableName: "tbl_tab_detailhtd_incomplete",
                            data: [
                                { str_colName: "RepSerNo", value: objIncompIdHardness.incompRepSerNo },
                                { str_colName: "MstSerNo", value: 0 },
                                { str_colName: "RecSeqNo", value: 1 },
                                { str_colName: "DataValueThick", value: objHardness.thicknessNom == 0 ? 0 : dataValueObj.thickness },
                                { str_colName: "DataValueDOLOBO", value: objHardness.opNominal == 0 ? 0 : dataValueObj.dimension },
                                { str_colName: "DataValueHard", value: dataValueObj.hardness },
                                { str_colName: "DecimalPointThick", value: objHardness.thicknessNom == 0 ? 0 : objHardness.thicknessDecimal },
                                { str_colName: "DecimalPointDOLOBO", value: objHardness.opNominal == 0 ? 0 : objHardness.dimensionDecimal },
                                { str_colName: "DecimalPointHard", value: objHardness.hardnessDecimal },
                                { str_colName: "idsNo", value: parseInt(objHardness.idsNo) },
                            ],
                        };
                        await database.save(insertDetailObj);
                        dataValueObj = {};


                        objHardness.sampleNo = objHardness.sampleNo + 1;

                        var tempObj = globalData.arrIncompleteRemark.find(
                            (k) => k.IdsNo == IdsNo
                        );
                        if (tempObj == undefined) {
                            globalData.arrIncompleteRemark.push({
                                weighment: true,
                                RepoSr: masterSrno[0].insertId,
                                Type: 7,
                                IdsNo: IdsNo,
                            });
                        } else {
                            tempObj.weighment = true;
                            tempObj.RepoSr = masterSrno[0].insertId;
                            tempObj.Type = 7;
                            //globalData.arrIncompleteRemark.IdsNo = IdsNo;
                        }
                        //    var HRDProtocol = `${objHardness.protocolIncomingType}R0` +
                        //         objHardness.sampleNo +
                        //         " Samples Received,,,,,";
                        //         return HRDProtocol;
                    } else {
                        if (objHardness.sampleNo > 0 && (objHardness.sampleNo + 1) <= intNos) {

                            var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                (sr) => sr.idsNo == IdsNo
                            );

                            const insertDetailObj = {
                                str_tableName: "tbl_tab_detailhtd_incomplete",
                                data: [
                                    { str_colName: "RepSerNo", value: objIncompIdHardness.incompRepSerNo },
                                    { str_colName: "MstSerNo", value: 0 },
                                    { str_colName: "RecSeqNo", value: objHardness.sampleNo + 1 },
                                    { str_colName: "DataValueThick", value: objHardness.thicknessNom == 0 ? 0 : dataValueObj.thickness },
                                    { str_colName: "DataValueDOLOBO", value: objHardness.opNominal == 0 ? 0 : dataValueObj.dimension },
                                    { str_colName: "DataValueHard", value: dataValueObj.hardness },
                                    { str_colName: "DecimalPointThick", value: objHardness.thicknessNom == 0 ? 0 : objHardness.thicknessDecimal },
                                    { str_colName: "DecimalPointDOLOBO", value: objHardness.opNominal == 0 ? 0 : objHardness.dimensionDecimal },
                                    { str_colName: "DecimalPointHard", value: objHardness.hardnessDecimal },
                                    { str_colName: "idsNo", value: parseInt(IdsNo) },
                                ],
                            };
                            await database.save(insertDetailObj)
                            dataValueObj = {};
                            // incrementing sample only after inserting into database
                            objHardness.sampleNo = objHardness.sampleNo + 1;

                            if ((objHardness.sampleNo) == intNos) {
                                //console.log(globalData.hardnessIncompleteId);
                                await hardnessData.saveHardnessData(
                                    objIncompIdHardness.incompRepSerNo,
                                    IdsNo
                                );
                                // Clear flag for Incomplete remark on weighment complete like (test aborted, balance off, Auto logout);
                                if (globalData.arrIncompleteRemark != undefined) {
                                    globalData.arrIncompleteRemark = globalData.arrIncompleteRemark.filter(
                                        (k) => k.IdsNo != IdsNo
                                    );
                                }
                                var selectedIds;
                                var IPQCObject = globalData.arr_IPQCRelIds.find(
                                    (k) => k.idsNo == IdsNo
                                );
                                if (IPQCObject != undefined) {
                                    selectedIds = IPQCObject.selectedIds;
                                } else {
                                    selectedIds = IdsNo;
                                }
                                var objUpdateValidation = {
                                    str_tableName: "tbl_cubical",
                                    data: [{ str_colName: "Sys_Validation", value: 0 }],
                                    condition: [{ str_colName: "Sys_IDSNo", value: selectedIds }],
                                };

                                await database.update(objUpdateValidation);
                                let objActivity = {};
                                Object.assign(
                                    objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: "Hardness Weighment Completed on IDS" + IdsNo }
                                );
                                await objActivityLog.ActivityLogEntry(objActivity);
                                objHardness.sampleNo = 0;
                                // objHardness.dataFlowStatus = false;
                                // objHardness.idsIPAddress = '';
                                var response = `${objHardness.protocolIncomingType}R3,,,,,`;
                                console.log(objHardness)
                                objInstrumentUsage.InstrumentUsage(
                                    "Hardness",
                                    IdsNo,
                                    "tbl_instrumentlog_hardness",
                                    "",
                                    "completed"
                                );
                                objMonitor.monit({
                                    case: "BL",
                                    idsNo: IdsNo,
                                    data: { test: "HARDNESS", flag: "COMPLETED" },
                                });
                                return response;
                            } else {
                                // var HRDProtocol = `${objHardness.protocolIncomingType}R0` +
                                // objHardness.sampleNo +
                                // " Samples Received,,,,,";
                                // return HRDProtocol;
                            }

                        }
                    }
                }
            }

            if (i == dataInLines.length - 1) {
                var HRDProtocol = `${objHardness.protocolIncomingType}R0` +
                    objHardness.sampleNo +
                    " Samples Received,,,,,";
                return HRDProtocol;
            }
        }

        console.log(dataValues);

    }

    async insertBulkWeighmentHardness_425Lan(data, IdsNo) {
        // Check when there isIPQC
        var IPQCObject = globalData.arr_IPQCRelIds.find((k) => k.idsNo == IdsNo);
        var selectedIds;
        var objLotData = globalData.arrLot.find((k) => k.idsNo == IdsNo);

        if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds;
        } else {
            selectedIds = IdsNo;
        }
        var currentCubicle = globalData.arrIdsInfo.find(
            (k) => k.Sys_IDSNo == IdsNo
        );
        //var hardnessReading = protocol.substring(0, 7);
        const tempUserObject = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
        var objHardness = globalData.arrHardness425.find(
            (ht) => ht.idsNo == IdsNo
        );
        objHardness.mgcnt = 0;
        objHardness.mmcnt = 0;
        objHardness.ncnt = 0;
        var productlimits = globalData.arr_limits.find((al) => al.idsNo == IdsNo);
        var intNos = productlimits.Hardness.noOfSamples;

        var parseThickness = false, parseDimension = false, parseHardness = false, sampleParsed;
        let dataInLines = data.split('X').filter(str => str.length);  // to remove empty strings

        let dataValueObj = {};
        var isInvalisString = false;
        for (let i = 0; i < dataInLines.length; i++) {
            let sampleStr = dataInLines[i];


            if (sampleStr.includes('mg')) {

                objHardness.mgcnt = objHardness.mgcnt + 1;

                parseThickness = true;
            } else if (sampleStr.includes('mm') && parseThickness == true) {

                objHardness.mmcnt = objHardness.mmcnt + 1;

                dataValueObj.thickness = sampleStr.replace('mm', '').trim();
                parseThickness = false;
                parseDimension = true;
            } else if (sampleStr.includes('mm') && parseDimension == true) {
                objHardness.mmcnt = objHardness.mmcnt + 1;

                dataValueObj.dimension = sampleStr.replace('mm', '').trim();
                parseDimension = false;

            } else if (sampleStr.includes('N') && parseDimension == false && parseThickness == false) {
                objHardness.ncnt = objHardness.ncnt + 1;

                dataValueObj.hardness = sampleStr.split(' ').filter(s => s.length)[0].trim();

                let validData;
                if (dataValueObj.thickness && dataValueObj.dimension && dataValueObj.hardness) {
                    validData = true;
                } else {
                    isInvalisString = true;
                    validData = false;
                }
                if (validData == true) {
                    //    objHardness.sampleNo = objHardness.sampleNo + 1;

                    // validation ========================

                    let hardness = dataValueObj.hardness;
                    let thickness = dataValueObj.thickness;
                    let dimension = dataValueObj.dimension;

                    if (productlimits.Hardness == undefined && hardness != '--' ||
                        productlimits.Thickness == undefined && thickness != '--' ||
                        (productlimits.Length == undefined && productlimits.Diameter == undefined) && dimension != '--') {
                        return `${objHardness.protocolIncomingType}R40Invalid String,,,,`;
                    }

                    if ((hardness != 'NA') && (hardness != '--') && (isNaN(Number(hardness)))) {
                        isInvalisString = true;
                    }
                    if ((thickness != 'NA') && (thickness != '--') && (isNaN(Number(thickness)))) {
                        isInvalisString = true;
                    }
                    if ((dimension != 'NA') && (dimension != '--') && (isNaN(Number(dimension)))) {
                        isInvalisString = true;
                    }

                    if (isInvalisString) {
                        dataValueObj = {};
                    } else {
                        if ((objHardness.sampleNo + 1) == 1) {
                            let objActivity = {};
                            Object.assign(
                                objActivity,
                                { strUserId: tempUserObject.UserId },
                                { strUserName: tempUserObject.UserName },
                                { activity: "Hardness Weighment Started on IDS" + IdsNo }
                            );
                            await objActivityLog.ActivityLogEntry(objActivity).catch((error) => {
                                logFromPC.addtoProtocolLog(error, "error");
                                console.log(error);
                            });
                            var productObj = globalData.arrIdsInfo.find(
                                (k) => k.Sys_IDSNo == selectedIds
                            );

                            const checkMasterData = {
                                str_tableName: "tbl_tab_masterhtd_incomplete",
                                data: "MAX(MstSerNo) AS SeqNo",
                                condition: [
                                    { str_colName: "BFGCode", value: productObj.Sys_BFGCode, comp: "eq" },
                                    { str_colName: "ProductName", value: productObj.Sys_ProductName, comp: "eq" },
                                    { str_colName: "PVersion", value: productObj.Sys_PVersion, comp: "eq" },
                                    { str_colName: "Version", value: productObj.Sys_Version, comp: "eq" },
                                    { str_colName: "BatchNo", value: productObj.Sys_Batch, comp: "eq" },
                                    { str_colName: "Idsno", value: IdsNo, comp: "eq" },
                                ],
                            };
                            // console.log("tbl_tab_masterhtd_incomplete  1 :" + checkMasterData);
                            var result = await database.select(checkMasterData);
                            var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                (sr) => sr.idsNo == IdsNo
                            );
                            var intMstSerNo;
                            if (result[0][0].SeqNo == null) {
                                intMstSerNo = 1;
                                objIncompIdHardness.incompRepSerNo = intMstSerNo;
                            } else {
                                var newMstSerNo = result[0][0].SeqNo + 1;
                                intMstSerNo = newMstSerNo;
                                objIncompIdHardness.incompRepSerNo = intMstSerNo;
                            }

                            if (productlimits.Length != undefined) {
                                objHardness.colName = "Length";
                                objHardness.opNominal = productlimits.Length.nominal;
                                objHardness.opNegTol = productlimits.Length.T2Neg;
                                objHardness.opPosTol = productlimits.Length.T2Pos;
                            } else if (productlimits.Diameter != undefined) {
                                objHardness.colName = "Diameter";
                                objHardness.opNominal = productlimits.Diameter.nominal;
                                objHardness.opNegTol = productlimits.Diameter.T2Neg;
                                objHardness.opPosTol = productlimits.Diameter.T2Pos;
                            } else {
                                objHardness.colName = "NA";
                                objHardness.opNominal = 0;
                                objHardness.opNegTol = 0;
                                objHardness.opPosTol = 0;
                            }

                            if (productlimits.Thickness == undefined) {
                                objHardness.thicknessNom = 0;
                                objHardness.thicknesneg = 0;
                                objHardness.thicknespos = 0;
                            } else {
                                objHardness.thicknessNom =
                                    productlimits.Thickness.nominal;
                                objHardness.thicknesneg = productlimits.Thickness.T2Neg;
                                objHardness.thicknespos = productlimits.Thickness.T2Pos;
                            }

                            var side = "NA";
                            if (productObj.Sys_RotaryType == "Single") {
                                side = "NA";
                            } else {
                                side = productlimits.Hardness.side == "L" ? "LHS" : "RHS";
                            }

                            await clspowerbackup.insertPowerBackupData(productObj, objHardness.protocolIncomingType, tempUserObject, IdsNo, "htd", "Erweka TBH-425", "Hardness");
                            await objRemarkInComplete.updateEntry(IdsNo, 'Hardness');
                            var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
                            var HardnessUnit = "N";
                            let now = new Date();
                            var masterIncopleteData = {
                                str_tableName: "tbl_tab_masterhtd_incomplete",
                                data: [
                                    { str_colName: "MstSerNo", value: objIncompIdHardness.incompRepSerNo },
                                    { str_colName: "InstruId", value: 1 },
                                    { str_colName: "BFGCode", value: productObj.Sys_BFGCode },
                                    { str_colName: "ProductName", value: productObj.Sys_ProductName },
                                    { str_colName: "ProductType", value: ProductType.productType },
                                    { str_colName: "Idsno", value: IdsNo },
                                    { str_colName: "CubicalNo", value: productObj.Sys_CubicNo },
                                    { str_colName: "BalanceId", value: productObj.Sys_BalID },
                                    { str_colName: "VernierId", value: productObj.Sys_VernierID },
                                    { str_colName: "BatchNo", value: productObj.Sys_Batch },
                                    { str_colName: "UserId", value: tempUserObject.UserId },
                                    { str_colName: "UserName", value: tempUserObject.UserName },
                                    { str_colName: "PrDate", value: date.format(now, "YYYY-MM-DD") },
                                    { str_colName: "PrTime", value: date.format(now, "HH:mm:ss") },
                                    { str_colName: "Side", value: side },
                                    { str_colName: "Qty", value: productlimits.Hardness.noOfSamples },
                                    { str_colName: "Unit", value: HardnessUnit },
                                    { str_colName: "CubicleType", value: productObj.Sys_CubType },
                                    { str_colName: "ReportType", value: productObj.Sys_RptType },
                                    { str_colName: "MachineCode", value: productObj.Sys_MachineCode },
                                    { str_colName: "MFGCode", value: productObj.Sys_MfgCode },
                                    { str_colName: "BatchSize", value: productObj.Sys_BatchSize },
                                    { str_colName: "HardnessID", value: currentCubicle.Sys_HardID },
                                    { str_colName: "CubicleName", value: productObj.Sys_dept },
                                    { str_colName: "CubicleLocation", value: productObj.Sys_dept },
                                    { str_colName: "IsArchived", value: 0 },
                                    { str_colName: "PVersion", value: productObj.Sys_PVersion },
                                    { str_colName: "Version", value: productObj.Sys_Version },
                                    { str_colName: "ColHeadDOLOBO", value: objHardness.colName },
                                    { str_colName: "NomThick", value: objHardness.thicknessNom },
                                    { str_colName: "PosTolThick", value: objHardness.thicknespos },
                                    { str_colName: "NegTolThick", value: objHardness.thicknesneg },
                                    { str_colName: "NomHard", value: productlimits.Hardness.nominal },
                                    { str_colName: "PosTolHard", value: productlimits.Hardness.T1Pos },
                                    { str_colName: "NegTolHard", value: productlimits.Hardness.T1Neg },
                                    { str_colName: "NomDOLOBO", value: objHardness.opNominal },
                                    { str_colName: "PosTolDOLOBO", value: objHardness.opPosTol },
                                    { str_colName: "NegTolDOLOBO", value: objHardness.opNegTol },
                                    { str_colName: "GraphType", value: productlimits.Hardness.LimitOn[0] },
                                    { str_colName: "RepoLabel11", value: currentCubicle.Sys_Validation },
                                    { str_colName: "WgmtModeNo", value: 7 },
                                    { str_colName: "Lot", value: objLotData.LotNo },
                                    { str_colName: "Stage", value: productObj.Sys_Stage },
                                    { str_colName: "Area", value: productObj.Sys_Area },
                                    { str_colName: "DecimalPoint", value: objHardness.hardnessDecimal },
                                ],
                            };

                            var masterSrno = await database.save(masterIncopleteData);

                            var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                (sr) => sr.idsNo == IdsNo
                            );
                            var objHardness = globalData.arrHardness425.find(
                                (ht) => ht.idsNo == IdsNo
                            );
                            objInstrumentUsage.InstrumentUsage("Hardness", IdsNo, "tbl_instrumentlog_hardness", "Hardness", "started");
                            objIncompIdHardness.incompRepSerNo = masterSrno[0].insertId;
                            //console.log("Third",objHardness);

                            const getRepsrNo = {
                                str_tableName: "tbl_tab_masterhtd_incomplete",
                                data: "MAX(RepSerNo) AS RepSerNo",
                                condition: [
                                    { str_colName: "BFGCode", value: productObj.Sys_BFGCode, comp: "eq" },
                                    { str_colName: "ProductName", value: productObj.Sys_ProductName, comp: "eq" },
                                    { str_colName: "PVersion", value: productObj.Sys_PVersion, comp: "eq" },
                                    { str_colName: "Version", value: productObj.Sys_Version, comp: "eq" },
                                    { str_colName: "BatchNo", value: productObj.Sys_Batch, comp: "eq" },
                                    { str_colName: "Idsno", value: IdsNo, comp: "eq" },
                                ],
                            };


                            var res = await database.select(getRepsrNo);
                            let objUpdatepowerbackup = {
                                str_tableName: "tbl_powerbackup",
                                data: [
                                    { str_colName: "Incomp_RepSerNo", value: res[0][0].RepSerNo },
                                ],
                                condition: [
                                    { str_colName: "Idsno", value: IdsNo },
                                    { str_colName: "Sys_BFGCode", value: productObj.Sys_BFGCode },
                                    { str_colName: "Sys_Batch", value: productObj.Sys_Batch },
                                ],
                            };
                            await database.update(objUpdatepowerbackup);

                            const insertDetailObj = {
                                str_tableName: "tbl_tab_detailhtd_incomplete",
                                data: [
                                    { str_colName: "RepSerNo", value: objIncompIdHardness.incompRepSerNo },
                                    { str_colName: "MstSerNo", value: 0 },
                                    { str_colName: "RecSeqNo", value: 1 },
                                    { str_colName: "DataValueThick", value: objHardness.thicknessNom == 0 ? 0 : dataValueObj.thickness },
                                    { str_colName: "DataValueDOLOBO", value: objHardness.opNominal == 0 ? 0 : dataValueObj.dimension },
                                    { str_colName: "DataValueHard", value: dataValueObj.hardness },
                                    { str_colName: "DecimalPointThick", value: objHardness.thicknessNom == 0 ? 0 : objHardness.thicknessDecimal },
                                    { str_colName: "DecimalPointDOLOBO", value: objHardness.opNominal == 0 ? 0 : objHardness.dimensionDecimal },
                                    { str_colName: "DecimalPointHard", value: objHardness.hardnessDecimal },
                                    { str_colName: "idsNo", value: parseInt(objHardness.idsNo) },
                                ],
                            };
                            await database.save(insertDetailObj);
                            dataValueObj = {};


                            objHardness.sampleNo = objHardness.sampleNo + 1;

                            var tempObj = globalData.arrIncompleteRemark.find(
                                (k) => k.IdsNo == IdsNo
                            );
                            if (tempObj == undefined) {
                                globalData.arrIncompleteRemark.push({
                                    weighment: true,
                                    RepoSr: masterSrno[0].insertId,
                                    Type: 7,
                                    IdsNo: IdsNo,
                                });
                            } else {
                                tempObj.weighment = true;
                                tempObj.RepoSr = masterSrno[0].insertId;
                                tempObj.Type = 7;
                                //globalData.arrIncompleteRemark.IdsNo = IdsNo;
                            }
                            //    var HRDProtocol = `${objHardness.protocolIncomingType}R0` +
                            //         objHardness.sampleNo +
                            //         " Samples Received,,,,,";
                            //         return HRDProtocol;
                        } else {
                            if (objHardness.sampleNo > 0 && (objHardness.sampleNo + 1) <= intNos) {

                                var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                    (sr) => sr.idsNo == IdsNo
                                );

                                const insertDetailObj = {
                                    str_tableName: "tbl_tab_detailhtd_incomplete",
                                    data: [
                                        { str_colName: "RepSerNo", value: objIncompIdHardness.incompRepSerNo },
                                        { str_colName: "MstSerNo", value: 0 },
                                        { str_colName: "RecSeqNo", value: objHardness.sampleNo + 1 },
                                        { str_colName: "DataValueThick", value: objHardness.thicknessNom == 0 ? 0 : dataValueObj.thickness },
                                        { str_colName: "DataValueDOLOBO", value: objHardness.opNominal == 0 ? 0 : dataValueObj.dimension },
                                        { str_colName: "DataValueHard", value: dataValueObj.hardness },
                                        { str_colName: "DecimalPointThick", value: objHardness.thicknessNom == 0 ? 0 : objHardness.thicknessDecimal },
                                        { str_colName: "DecimalPointDOLOBO", value: objHardness.opNominal == 0 ? 0 : objHardness.dimensionDecimal },
                                        { str_colName: "DecimalPointHard", value: objHardness.hardnessDecimal },
                                        { str_colName: "idsNo", value: parseInt(IdsNo) },
                                    ],
                                };
                                await database.save(insertDetailObj)
                                dataValueObj = {};
                                // incrementing sample only after inserting into database
                                objHardness.sampleNo = objHardness.sampleNo + 1;

                                if ((objHardness.sampleNo) == intNos) {
                                    //console.log(globalData.hardnessIncompleteId);
                                    await hardnessData.saveHardnessData(
                                        objIncompIdHardness.incompRepSerNo,
                                        IdsNo
                                    );
                                    // Clear flag for Incomplete remark on weighment complete like (test aborted, balance off, Auto logout);
                                    if (globalData.arrIncompleteRemark != undefined) {
                                        globalData.arrIncompleteRemark = globalData.arrIncompleteRemark.filter(
                                            (k) => k.IdsNo != IdsNo
                                        );
                                    }
                                    var selectedIds;
                                    var IPQCObject = globalData.arr_IPQCRelIds.find(
                                        (k) => k.idsNo == IdsNo
                                    );
                                    if (IPQCObject != undefined) {
                                        selectedIds = IPQCObject.selectedIds;
                                    } else {
                                        selectedIds = IdsNo;
                                    }
                                    var objUpdateValidation = {
                                        str_tableName: "tbl_cubical",
                                        data: [{ str_colName: "Sys_Validation", value: 0 }],
                                        condition: [{ str_colName: "Sys_IDSNo", value: selectedIds }],
                                    };

                                    await database.update(objUpdateValidation);
                                    let objActivity = {};
                                    Object.assign(
                                        objActivity,
                                        { strUserId: tempUserObject.UserId },
                                        { strUserName: tempUserObject.UserName },
                                        { activity: "Hardness Weighment Completed on IDS" + IdsNo }
                                    );
                                    await objActivityLog.ActivityLogEntry(objActivity);
                                    objHardness.sampleNo = 0;


                                    // //
                                    // var productObjforside = globalData.arrIdsInfo.find(
                                    //     (k) => k.Sys_IDSNo == selectedIds
                                    // );
                                    // if (productObjforside.Sys_RotaryType == "Single") {
                                    //     objHardness.dataFlowStatus = false;
                                    // } else {
                                    //     if (productlimits.Hardness.side == "L") {
                                    //         objHardness.dataFlowStatus = false;
                                    //     } else {
                                    //         objHardness.dataFlowStatus = false;
                                    //     }

                                    // }
                                    // //



                                    // objHardness.idsIPAddress = '';
                                    var response = `${objHardness.protocolIncomingType}R3,,,,,`;
                                    var objRemark = globalData.arrLLsampleRemark.find(k => k.idsNo == IdsNo);
                                    if (objRemark == undefined) {
                                        globalData.arrLLsampleRemark.push({ idsNo: IdsNo, remark: response })
                                    } else {
                                        objRemark.remark = response;
                                    }
                                    console.log(objHardness)
                                    objInstrumentUsage.InstrumentUsage(
                                        "Hardness",
                                        IdsNo,
                                        "tbl_instrumentlog_hardness",
                                        "",
                                        "completed"
                                    );
                                    objMonitor.monit({
                                        case: "BL",
                                        idsNo: IdsNo,
                                        data: { test: "HARDNESS", flag: "COMPLETED" },
                                    });
                                    return response;
                                } else {
                                    // var HRDProtocol = `${objHardness.protocolIncomingType}R0` +
                                    // objHardness.sampleNo +
                                    // " Samples Received,,,,,";
                                    // return HRDProtocol;
                                }

                            }
                        }

                    }





                }
            }

            if (i == dataInLines.length - 1) {
                if (((objHardness.mgcnt == objHardness.ncnt) && (objHardness.mmcnt == (objHardness.ncnt * 2)) && !isInvalisString)) {

                    objHardness.mgcnt = 0;
                    objHardness.mmcnt = 0;
                    objHardness.ncnt = 0;
                    var HRDProtocol = `${objHardness.protocolIncomingType}R0` +
                        objHardness.sampleNo +
                        " Samples Received,,,,,";
                    var objRemark = globalData.arrLLsampleRemark.find(k => k.idsNo == IdsNo);
                    if (objRemark == undefined) {
                        globalData.arrLLsampleRemark.push({ idsNo: IdsNo, remark: HRDProtocol })
                    } else {
                        objRemark.remark = HRDProtocol;
                    }
                    return HRDProtocol;

                } else {
                    dataValueObj = {};
                    objHardness.mgcnt = 0;
                    objHardness.mmcnt = 0;
                    objHardness.ncnt = 0;
                    return `${objHardness.protocolIncomingType}R40Invalid String,,,,`;


                }


            }


        }

        console.log(dataValues);

    }

    // can handle multiple samples [vighnesh]
    async insertBulkWeighmentHardness_425(IdsNo, protocol) {
        try {
            // Check when there isIPQC
            var IPQCObject = globalData.arr_IPQCRelIds.find((k) => k.idsNo == IdsNo);
            var selectedIds;
            var objLotData = globalData.arrLot.find((k) => k.idsNo == IdsNo);

            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var currentCubicle = globalData.arrIdsInfo.find(
                (k) => k.Sys_IDSNo == IdsNo
            );
            var actualProtocol = protocol;
            let now = new Date();
            var protocolValue = protocol.substring(0, 5); // starting 5 character
            var protocolValueData = protocol.substring(6); // starting 5 character
            var protocolIncomingType = protocolValue.substring(0, 1); //Check incoming Protocol is from "T" or "H"
            //var hardnessReading = protocol.substring(0, 7);
            const tempUserObject = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
            var objHardness = globalData.arrHardness425.find(
                (ht) => ht.idsNo == IdsNo
            );
            var productlimits = globalData.arr_limits.find((al) => al.idsNo == IdsNo);
            var objInvalid = globalData.arrBulkInvalid.find((k) => k.idsNo == IdsNo);

            if (protocolValue != "TD000" && protocolValue != "HD000") {
                /**
                 * @description We are here setting TD000 and HD000 to false
                 */
                var tempTDHD = globalData.arrTHHDrepet.find((k) => k.idsNo == IdsNo);
                if (tempTDHD == undefined) {
                    globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 });
                } else {
                    tempTDHD.flag = false;
                    tempTDHD.oc = 0;
                }
                /************************************************************* */
                var IncludeX = actualProtocol.includes("X");
                //console.log("IncludeX", IncludeX);
                if (IncludeX == true) {
                    var receivedProtocol = actualProtocol.replace("X", "").trim();
                    const objBulkInvalid = new bulkInvalid();
                    objBulkInvalid.invalidObj.idsNo = IdsNo;
                    objBulkInvalid.invalidObj.HD425.invalid = false;
                    objBulkInvalid.invalidObj.HD425.invalidMsg = "";
                    Object.assign(objInvalid, objBulkInvalid.invalidObj);
                } else {
                    IncludeX = false;
                }
                if (IncludeX == true) {
                    //console.log("IncludeX", IncludeX);
                    if (
                        receivedProtocol.includes("mm") &&
                        objHardness.dimensionParam == 0
                    ) {
                        var includeMM = protocolValueData.includes("mm");
                        //console.log("includeMM", includeMM);
                        if (includeMM == true) {
                            // var thicknessVal = protocolValueData.replace("mm", "").trim();
                            // if (protocolValueData.split('m')[0].trim() == "--") {
                            //     objHardness.thicknessVal = 0;
                            // } else {
                            objHardness.thicknessVal = protocolValueData.split("mm")[0].trim();
                            // }
                            objHardness.thicknessDecimal = 2; //thicknessVal.split('.').replace(/\D/g, '').length;//count number in given string
                            //Repeat is handled at the start So No need to check again
                            //if (receivedProtocol.includes("R") != true) {
                            objHardness.sampleNo = objHardness.sampleNo + 1;
                            //}

                            objHardness.dimensionParam = 1;
                            var isThickValid = parseFloat(objHardness.thicknessVal);
                            var isThickValid = isThickValid.toString();
                            // if(isThickValid == 'NaN') {
                            //     const objBulkInvalid = new bulkInvalid();
                            //     objBulkInvalid.invalidObj.idsNo = IdsNo;
                            //     objBulkInvalid.invalidObj.HD425.invalid = true;
                            //     objBulkInvalid.invalidObj.HD425.invalidMsg = "INVALID WGT PLS,REPEAT SAMPLES,,";
                            //     Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            // }
                            //console.log("First",objHardness);
                        }
                    } else if (
                        receivedProtocol.includes("mm") &&
                        objHardness.dimensionParam == 1
                    ) {
                        var includeMM = protocolValueData.includes("mm");
                        if (includeMM == true) {
                            // if (protocolValueData.split('m')[0].trim() == "--") {
                            //     objHardness.dimensionVal = 0;
                            // } else {
                            objHardness.dimensionVal = protocolValueData.split("mm")[0].trim();
                            // }
                            objHardness.dimensionDecimal = 2; // dimensionVal.split('.').replace(/\D/g, '').length;//count number in given string
                            objHardness.dimensionParam = 2;
                            //var isDimensionsValid = parseFloat(objHardness.dimensionVal);
                            //var isDimensionsValid = isDimensionsValid.toString();
                            // if(isDimensionsValid == 'NaN') {
                            //     const objBulkInvalid = new bulkInvalid();
                            //     objBulkInvalid.invalidObj.idsNo = IdsNo;
                            //     objBulkInvalid.invalidObj.HD425.invalid = true;
                            //     objBulkInvalid.invalidObj.HD425.invalidMsg = "INVALID WGT PLS,REPEAT SAMPLES,,";
                            //     Object.assign(objInvalid, objBulkInvalid.invalidObj);

                            // }
                            //console.log("SEcond",objHardness);
                        }
                    } else if (
                        (receivedProtocol.includes("NN") || receivedProtocol.includes("NR")) &&
                        objHardness.dimensionParam == 2
                    ) {
                        //|| receivedProtocol.includes("KP") ) {
                        // if (receivedProtocol.includes("--") != true) {

                        //objHardness.dimensionParam = 0;

                        objHardness.dimensionParam = 3;

                        var includeNorKp = protocolValueData.includes("N");
                        //var hardnessVal = 0;
                        if (includeNorKp == true) {
                            //var strRecivedProtocol = app.protocolToString(Buffer.from(protocolValueData,'utf8'));

                            objHardness.hardnessVal = protocolValueData.split("N")[0].trim().length == 0 ? 0 : protocolValueData.split("N")[0].trim()
                            // if (objHardness.hardnessVal == "") {
                            //     objHardness.hardnessVal = "NA";
                            // }
                            // else if(objHardness.hardnessVal == '--'){
                            //     objHardness.hardnessVal = 0;
                            // }
                            // var isHardnessValid = parseFloat(objHardness.hardnessVal);
                            // var isHardnessValid = isHardnessValid.toString();
                            // const objBulkInvalid = new bulkInvalid();
                            // objBulkInvalid.invalidObj.idsNo = IdsNo;
                            // if (isHardnessValid == "NaN" && !isHardnessValid == "NA") {
                            //     objBulkInvalid.invalidObj.HD425.invalid = true;
                            //     objBulkInvalid.invalidObj.HD425.invalidMsg =
                            //         "INVALID WGT PLS,REPEAT SAMPLES,,";
                            //     Object.assign(objInvalid, objBulkInvalid.invalidObj);
                            // }
                            // objBulkInvalid.invalidObj.HD425.invalid = false;
                            // if (
                            //     objBulkInvalid.invalidObj.HD425.invalid &&
                            //     objHardness.sampleNo == 1
                            // ) {
                            //     //var msg = "Invalid String,FORMAT PLS REPEAT,SAME SAMPLE,,"
                            //     var msg = `${protocolIncomingType}R40Invalid String,,,,`;
                            //     objHardness.sampleNo = objHardness.sampleNo - 1;
                            //     return msg;
                            // } else {
                            objHardness.hardnessDecimal = includeNorKp == true ? 0 : 2; // hardnessVal.split('.').replace(/\D/g, '').length;//count number in given string
                            //console.log("Hardness",objHardness);
                            var HardnessUnit = "N";
                            var doMasterEntry = objHardness.sampleNo == 1 ? true : false;
                            //added by vivek on 11-11-2019***************************/
                            var tempLimObj = globalData.arr_limits.find(
                                (k) => k.idsNo == IdsNo
                            );
                            var intNos = tempLimObj.Hardness.noOfSamples;
                            /***************************************************** */

                            if (objHardness.sampleNo <= intNos) {
                                if (doMasterEntry == true) {
                                    let objActivity = {};
                                    Object.assign(
                                        objActivity,
                                        { strUserId: tempUserObject.UserId },
                                        { strUserName: tempUserObject.UserName },
                                        { activity: "Hardness Weighment Started on IDS" + IdsNo }
                                    );
                                    await objActivityLog
                                        .ActivityLogEntry(objActivity)
                                        .catch((error) => {
                                            //logFromPC.addtoProtocolLog(error, "error");
                                            console.log(error);
                                        });
                                    var productObj = globalData.arrIdsInfo.find(
                                        (k) => k.Sys_IDSNo == selectedIds
                                    );

                                    const checkMasterData = {
                                        str_tableName: "tbl_tab_masterhtd_incomplete",
                                        data: "MAX(MstSerNo) AS SeqNo",
                                        condition: [
                                            {
                                                str_colName: "BFGCode",
                                                value: productObj.Sys_BFGCode,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "ProductName",
                                                value: productObj.Sys_ProductName,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "PVersion",
                                                value: productObj.Sys_PVersion,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "Version",
                                                value: productObj.Sys_Version,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "BatchNo",
                                                value: productObj.Sys_Batch,
                                                comp: "eq",
                                            },
                                            { str_colName: "Idsno", value: IdsNo, comp: "eq" },
                                        ],
                                    };
                                    // console.log("tbl_tab_masterhtd_incomplete  1 :" + checkMasterData);
                                    var result = await database.select(checkMasterData);
                                    var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                        (sr) => sr.idsNo == IdsNo
                                    );
                                    var intMstSerNo;
                                    if (result[0][0].SeqNo == null) {
                                        intMstSerNo = 1;
                                        objIncompIdHardness.incompRepSerNo = intMstSerNo;
                                    } else {
                                        var newMstSerNo = result[0][0].SeqNo + 1;
                                        intMstSerNo = newMstSerNo;
                                        objIncompIdHardness.incompRepSerNo = intMstSerNo;
                                    }

                                    /***  AS PER shraddhanands and vinod powade: bredth will always perform on Vernier so we are not checking it in
                                                        Multiparameter hardness **/
                                    // if (productlimits.Breadth != undefined) {
                                    //     objHardness.colName = "Breadth";
                                    //     objHardness.opNominal = productlimits.Breadth.nominal;
                                    //     objHardness.opNegTol = productlimits.Breadth.T2Neg;
                                    //     objHardness.opPosTol = productlimits.Breadth.T2Pos;
                                    // }
                                    // else
                                    if (productlimits.Length != undefined) {
                                        objHardness.colName = "Length";
                                        objHardness.opNominal = productlimits.Length.nominal;
                                        objHardness.opNegTol = productlimits.Length.T2Neg;
                                        objHardness.opPosTol = productlimits.Length.T2Pos;
                                    } else if (productlimits.Diameter != undefined) {
                                        objHardness.colName = "Diameter";
                                        objHardness.opNominal = productlimits.Diameter.nominal;
                                        objHardness.opNegTol = productlimits.Diameter.T2Neg;
                                        objHardness.opPosTol = productlimits.Diameter.T2Pos;
                                    } else {
                                        objHardness.colName = "NA";
                                        objHardness.opNominal = 0;
                                        objHardness.opNegTol = 0;
                                        objHardness.opPosTol = 0;
                                    }

                                    if (productlimits.Thickness == undefined) {
                                        objHardness.thicknessNom = 0;
                                        objHardness.thicknesneg = 0;
                                        objHardness.thicknespos = 0;
                                    } else {
                                        objHardness.thicknessNom =
                                            productlimits.Thickness.nominal;
                                        objHardness.thicknesneg = productlimits.Thickness.T2Neg;
                                        objHardness.thicknespos = productlimits.Thickness.T2Pos;
                                    }

                                    var side = "NA";
                                    if (productObj.Sys_RotaryType == "Single") {
                                        side = "NA";
                                    } else {
                                        side = productlimits.Hardness.side == "L" ? "LHS" : "RHS";
                                    }

                                    await clspowerbackup.insertPowerBackupData(
                                        currentCubicle,
                                        protocolIncomingType,
                                        tempUserObject,
                                        IdsNo,
                                        "htd",
                                        "Erweka TBH-425",
                                        "Hardness"
                                    );
                                    var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
                                    var masterIncopleteData = {
                                        str_tableName: "tbl_tab_masterhtd_incomplete",
                                        data: [
                                            {
                                                str_colName: "MstSerNo",
                                                value: objIncompIdHardness.incompRepSerNo,
                                            },
                                            { str_colName: "InstruId", value: 1 },
                                            {
                                                str_colName: "BFGCode",
                                                value: productObj.Sys_BFGCode,
                                            },
                                            {
                                                str_colName: "ProductName",
                                                value: productObj.Sys_ProductName,
                                            },
                                            {
                                                str_colName: "ProductType",
                                                value: ProductType.productType,
                                            },

                                            { str_colName: "Idsno", value: IdsNo },
                                            {
                                                str_colName: "CubicalNo",
                                                value: productObj.Sys_CubicNo,
                                            },
                                            {
                                                str_colName: "BalanceId",
                                                value: productObj.Sys_BalID,
                                            },
                                            {
                                                str_colName: "VernierId",
                                                value: productObj.Sys_VernierID,
                                            },
                                            { str_colName: "BatchNo", value: productObj.Sys_Batch },
                                            { str_colName: "UserId", value: tempUserObject.UserId },
                                            {
                                                str_colName: "UserName",
                                                value: tempUserObject.UserName,
                                            },
                                            {
                                                str_colName: "PrDate",
                                                value: date.format(now, "YYYY-MM-DD"),
                                            },
                                            {
                                                str_colName: "PrTime",
                                                value: date.format(now, "HH:mm:ss"),
                                            },
                                            { str_colName: "Side", value: side },
                                            {
                                                str_colName: "Qty",
                                                value: productlimits.Hardness.noOfSamples,
                                            },
                                            { str_colName: "Unit", value: HardnessUnit },
                                            {
                                                str_colName: "CubicleType",
                                                value: productObj.Sys_CubType,
                                            },
                                            {
                                                str_colName: "ReportType",
                                                value: productObj.Sys_RptType,
                                            },
                                            {
                                                str_colName: "MachineCode",
                                                value: productObj.Sys_MachineCode,
                                            },
                                            {
                                                str_colName: "MFGCode",
                                                value: productObj.Sys_MfgCode,
                                            },
                                            {
                                                str_colName: "BatchSize",
                                                value: productObj.Sys_BatchSize,
                                            },
                                            {
                                                str_colName: "HardnessID",
                                                value: currentCubicle.Sys_HardID,
                                            },
                                            {
                                                str_colName: "CubicleName",
                                                value: productObj.Sys_dept,
                                            },
                                            {
                                                str_colName: "CubicleLocation",
                                                value: productObj.Sys_dept,
                                            },
                                            { str_colName: "IsArchived", value: 0 },
                                            {
                                                str_colName: "PVersion",
                                                value: productObj.Sys_PVersion,
                                            },
                                            {
                                                str_colName: "Version",
                                                value: productObj.Sys_Version,
                                            },
                                            {
                                                str_colName: "ColHeadDOLOBO",
                                                value: objHardness.colName,
                                            },
                                            {
                                                str_colName: "NomThick",
                                                value: objHardness.thicknessNom,
                                            },
                                            {
                                                str_colName: "PosTolThick",
                                                value: objHardness.thicknespos,
                                            },
                                            {
                                                str_colName: "NegTolThick",
                                                value: objHardness.thicknesneg,
                                            },
                                            {
                                                str_colName: "NomHard",
                                                value: productlimits.Hardness.nominal,
                                            },
                                            {
                                                str_colName: "PosTolHard",
                                                value: productlimits.Hardness.T1Pos,
                                            },
                                            {
                                                str_colName: "NegTolHard",
                                                value: productlimits.Hardness.T1Neg,
                                            },
                                            {
                                                str_colName: "NomDOLOBO",
                                                value: objHardness.opNominal,
                                            },
                                            {
                                                str_colName: "PosTolDOLOBO",
                                                value: objHardness.opPosTol,
                                            },
                                            {
                                                str_colName: "NegTolDOLOBO",
                                                value: objHardness.opNegTol,
                                            },
                                            {
                                                str_colName: "GraphType",
                                                value: productlimits.Hardness.LimitOn[0],
                                            },
                                            {
                                                str_colName: "RepoLabel11",
                                                value: currentCubicle.Sys_Validation,
                                            },
                                            {
                                                str_colName: "WgmtModeNo",
                                                value: 7,
                                            },
                                            { str_colName: "Lot", value: objLotData.LotNo },
                                            { str_colName: "Stage", value: productObj.Sys_Stage },
                                        ],
                                    };

                                    var masterSrno = await database.save(masterIncopleteData);

                                    var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                        (sr) => sr.idsNo == IdsNo
                                    );
                                    var objHardness = globalData.arrHardness425.find(
                                        (ht) => ht.idsNo == IdsNo
                                    );
                                    objInstrumentUsage.InstrumentUsage(
                                        "Hardness",
                                        IdsNo,
                                        "tbl_instrumentlog_hardness",
                                        "Hardness",
                                        "started"
                                    );
                                    objIncompIdHardness.incompRepSerNo = masterSrno[0].insertId;
                                    //console.log("Third",objHardness);

                                    const getRepsrNo = {
                                        str_tableName: "tbl_tab_masterhtd_incomplete",
                                        data: "MAX(RepSerNo) AS RepSerNo",
                                        condition: [
                                            {
                                                str_colName: "BFGCode",
                                                value: productObj.Sys_BFGCode,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "ProductName",
                                                value: productObj.Sys_ProductName,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "PVersion",
                                                value: productObj.Sys_PVersion,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "Version",
                                                value: productObj.Sys_Version,
                                                comp: "eq",
                                            },
                                            {
                                                str_colName: "BatchNo",
                                                value: productObj.Sys_Batch,
                                                comp: "eq",
                                            },
                                            { str_colName: "Idsno", value: IdsNo, comp: "eq" },
                                        ],
                                    };


                                    var res = await database.select(getRepsrNo);
                                    let objUpdatepowerbackup = {
                                        str_tableName: "tbl_powerbackup",
                                        data: [
                                            {
                                                str_colName: "Incomp_RepSerNo",
                                                value: res[0][0].RepSerNo,
                                            },
                                        ],
                                        condition: [
                                            { str_colName: "Idsno", value: IdsNo },
                                            {
                                                str_colName: "Sys_BFGCode",
                                                value: productObj.Sys_BFGCode,
                                            },
                                            {
                                                str_colName: "Sys_Batch",
                                                value: productObj.Sys_Batch,
                                            },
                                        ],
                                    };
                                    await database.update(objUpdatepowerbackup);

                                    const insertDetailObj = {
                                        str_tableName: "tbl_tab_detailhtd_incomplete",
                                        data: [
                                            {
                                                str_colName: "RepSerNo",
                                                value: objIncompIdHardness.incompRepSerNo,
                                            },
                                            { str_colName: "MstSerNo", value: 0 },
                                            {
                                                str_colName: "RecSeqNo",
                                                value: objHardness.sampleNo,
                                            },
                                            {
                                                str_colName: "DataValueThick",
                                                value:
                                                    objHardness.thicknessNom == 0
                                                        ? 0
                                                        : objHardness.thicknessVal,
                                            },
                                            {
                                                str_colName: "DataValueDOLOBO",
                                                value:
                                                    objHardness.opNominal == 0
                                                        ? 0
                                                        : objHardness.dimensionVal,
                                            },
                                            {
                                                str_colName: "DataValueHard",
                                                value: objHardness.hardnessVal,
                                            },
                                            {
                                                str_colName: "DecimalPointThick",
                                                value:
                                                    objHardness.thicknessNom == 0
                                                        ? 0
                                                        : objHardness.thicknessDecimal,
                                            },
                                            {
                                                str_colName: "DecimalPointDOLOBO",
                                                value:
                                                    objHardness.opNominal == 0
                                                        ? 0
                                                        : objHardness.dimensionDecimal,
                                            },
                                            {
                                                str_colName: "DecimalPointHard",
                                                value: objHardness.hardnessDecimal,
                                            },
                                            {
                                                str_colName: "idsNo",
                                                value: parseInt(objHardness.idsNo),
                                            },
                                        ],
                                    };
                                    const DetailsEntries = {
                                        str_tableName: "tbl_tab_detailhtd_incomplete",
                                        data: 'MAX(RecSeqNo) AS SeqNo',
                                        condition: [
                                            { str_colName: 'RepSerNo', value: objIncompIdHardness.incompRepSerNo, comp: 'eq' }
                                        ]
                                    }
                                    var tabDetails = await database.select(DetailsEntries)
                                    if (tabDetails[0][0].SeqNo == null) {
                                        var entries = 1
                                    } else {
                                        var entries = tabDetails[0][0].SeqNo + 1
                                    }

                                    if (entries == objHardness.sampleNo) {

                                        await database.save(insertDetailObj);
                                    }
                                    else {
                                        console.log("repeat sample recieved at sampleno ", entries)
                                        objHardness.sampleNo = entries - 1
                                    }

                                    var tempObj = globalData.arrIncompleteRemark.find(
                                        (k) => k.IdsNo == IdsNo
                                    );
                                    if (tempObj == undefined) {
                                        globalData.arrIncompleteRemark.push({
                                            weighment: true,
                                            RepoSr: masterSrno[0].insertId,
                                            Type: 7,
                                            IdsNo: IdsNo,
                                        });
                                    } else {
                                        tempObj.weighment = true;
                                        tempObj.RepoSr = masterSrno[0].insertId;
                                        tempObj.Type = 7;
                                        //globalData.arrIncompleteRemark.IdsNo = IdsNo;
                                    }
                                    globalData.arrHardness425[0] = {
                                        dimensionParam: 0,
                                        dimensionDecimal: 0,
                                        dimensionVal: 0,
                                        idsNo: IdsNo,
                                        hardnessVal: 0,
                                        thicknessDecimal: 0,
                                        thicknessVal: 0,
                                        sampleNo: objHardness.sampleNo,
                                        hardnessDecimal: objHardness.hardnessDecimal,
                                        colName: objHardness.colName,
                                        opNominal: objHardness.opNominal,
                                        opNegTol: objHardness.opNegTol,
                                        opPosTol: objHardness.opPosTol,
                                        thicknessNom: objHardness.thicknessNom,
                                        thicknesneg: objHardness.thicknesneg,
                                        thicknespos: objHardness.thicknespos,
                                        invalidsamno: objHardness.invalidsamno,
                                        saved: true,
                                    }
                                } else {
                                    if (objHardness.sampleNo > 0) {
                                        var objHardness = globalData.arrHardness425.find(
                                            (ht) => ht.idsNo == IdsNo
                                        );
                                        var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                                            (sr) => sr.idsNo == IdsNo
                                        );
                                        const insertDetailObj = {
                                            str_tableName: "tbl_tab_detailhtd_incomplete",
                                            data: [
                                                {
                                                    str_colName: "RepSerNo",
                                                    value: objIncompIdHardness.incompRepSerNo,
                                                },
                                                { str_colName: "MstSerNo", value: 0 },
                                                {
                                                    str_colName: "RecSeqNo",
                                                    value: objHardness.sampleNo,
                                                },
                                                {
                                                    str_colName: "DataValueThick",
                                                    value:
                                                        objHardness.thicknessNom == 0
                                                            ? 0
                                                            : objHardness.thicknessVal,
                                                },
                                                {
                                                    str_colName: "DataValueDOLOBO",
                                                    value:
                                                        objHardness.opNominal == 0
                                                            ? 0
                                                            : objHardness.dimensionVal,
                                                },
                                                {
                                                    str_colName: "DataValueHard",
                                                    value: objHardness.hardnessVal,
                                                },
                                                {
                                                    str_colName: "DecimalPointThick",
                                                    value:
                                                        objHardness.thicknessNom == 0
                                                            ? 0
                                                            : objHardness.thicknessDecimal,
                                                },
                                                {
                                                    str_colName: "DecimalPointDOLOBO",
                                                    value:
                                                        objHardness.opNominal == 0
                                                            ? 0
                                                            : objHardness.dimensionDecimal,
                                                },
                                                {
                                                    str_colName: "DecimalPointHard",
                                                    value: objHardness.hardnessDecimal,
                                                },
                                                {
                                                    str_colName: "idsNo",
                                                    value: parseInt(objHardness.idsNo),
                                                },
                                            ],
                                        };
                                        const DetailsEntries = {
                                            str_tableName: "tbl_tab_detailhtd_incomplete",
                                            data: 'MAX(RecSeqNo) AS SeqNo',
                                            condition: [
                                                { str_colName: 'RepSerNo', value: objIncompIdHardness.incompRepSerNo, comp: 'eq' }
                                            ]
                                        }
                                        var tabDetails = await database.select(DetailsEntries)
                                        if (tabDetails[0][0].SeqNo == null) {
                                            var entries = 1
                                        } else {
                                            var entries = tabDetails[0][0].SeqNo + 1
                                        }

                                        if (entries == objHardness.sampleNo) {

                                            await database.save(insertDetailObj);
                                        }
                                        else {
                                            console.log("repeat sample recieved at sampleno ", entries)
                                            objHardness.sampleNo = entries - 1
                                        }
                                        // globalData.sampleNo++;
                                        if (objHardness.sampleNo < intNos) {
                                            globalData.arrHardness425[0] = {
                                                dimensionParam: 0,
                                                dimensionDecimal: 0,
                                                dimensionVal: 0,
                                                idsNo: IdsNo,
                                                hardnessVal: 0,
                                                thicknessDecimal: 0,
                                                thicknessVal: 0,
                                                sampleNo: objHardness.sampleNo,
                                                hardnessDecimal: objHardness.hardnessDecimal,
                                                colName: objHardness.colName,
                                                opNominal: objHardness.opNominal,
                                                opNegTol: objHardness.opNegTol,
                                                opPosTol: objHardness.opPosTol,
                                                thicknessNom: objHardness.thicknessNom,
                                                thicknesneg: objHardness.thicknesneg,
                                                thicknespos: objHardness.thicknespos,
                                                invalidsamno: objHardness.invalidsamno,
                                                saved: true,
                                            }
                                        } if (objHardness.sampleNo >= intNos) {
                                            globalData.arrHardness425[0] = {
                                                dimensionParam: objHardness.dimensionParam,
                                                dimensionDecimal: objHardness.dimensionDecimal,
                                                dimensionVal: objHardness.dimensionVal,
                                                idsNo: IdsNo,
                                                hardnessVal: objHardness.hardnessVal,
                                                thicknessDecimal: objHardness.thicknessDecimal,
                                                thicknessVal: objHardness.thicknessVal,
                                                sampleNo: objHardness.sampleNo,
                                                hardnessDecimal: objHardness.hardnessDecimal,
                                                colName: objHardness.colName,
                                                opNominal: objHardness.opNominal,
                                                opNegTol: objHardness.opNegTol,
                                                opPosTol: objHardness.opPosTol,
                                                thicknessNom: objHardness.thicknessNom,
                                                thicknesneg: objHardness.thicknesneg,
                                                thicknespos: objHardness.thicknespos,
                                                invalidsamno: objHardness.invalidsamno,
                                                saved: true,
                                            }
                                        }
                                    }
                                }
                            }

                        }
                        else {
                            return `${protocolIncomingType}R40Invalid String,,,,`;
                        }
                        // }
                    } else if (
                        (receivedProtocol.includes("NN") || receivedProtocol.includes("NR")) &&
                        objHardness.dimensionParam != 2
                    ) {
                        var tempLimObj = globalData.arr_limits.find((k) => k.idsNo == IdsNo);
                        var intNos = tempLimObj.Hardness.noOfSamples;
                        if (objHardness.sampleNo < intNos) {
                            globalData.arrHardness425[0] = {
                                dimensionParam: objHardness.dimensionParam,
                                dimensionDecimal: objHardness.dimensionDecimal,
                                dimensionVal: objHardness.dimensionVal,
                                idsNo: IdsNo,
                                hardnessVal: objHardness.hardnessVal,
                                thicknessDecimal: objHardness.thicknessDecimal,
                                thicknessVal: objHardness.thicknessVal,
                                sampleNo: objHardness.sampleNo,
                                hardnessDecimal: objHardness.hardnessDecimal,
                                colName: objHardness.colName,
                                opNominal: objHardness.opNominal,
                                opNegTol: objHardness.opNegTol,
                                opPosTol: objHardness.opPosTol,
                                thicknessNom: objHardness.thicknessNom,
                                thicknesneg: objHardness.thicknesneg,
                                thicknespos: objHardness.thicknespos,
                                invalidsamno: `${objHardness.invalidsamno},${objHardness.sampleNo}`,
                                saved: false,
                            }
                            console.log(globalData.arrHardness425[0]);
                        }
                    }
                    return protocolValue;
                } else {
                    return protocolValue;
                }
            } else {
                /**
                 * @description We are here setting TD000 and HD000 to true
                */
                var tempLimObj = globalData.arr_limits.find((k) => k.idsNo == IdsNo);
                var intNos = tempLimObj.Hardness.noOfSamples;
                if (objHardness.sampleNo >= intNos) {
                    objHardness.invalidsamno = null
                }
                if (objHardness.dimensionParam == 3 && objHardness.saved == true) {
                    objHardness.saved == false
                }
                if ((objHardness.dimensionParam == 2 || objHardness.dimensionParam == 1 || objHardness.dimensionParam == 0) || (objHardness.saved == false || objHardness.invalidsamno != null)) {
                    let objHardness = globalData.arrHardness425.find(
                        (ht) => ht.idsNo == IdsNo
                    );
                    objHardness.sampleNo = objHardness.dimensionParam == 0 ?
                        objHardness.sampleNo : objHardness.sampleNo - 1
                    objHardness.dimensionParam = 0;
                    var msg = "Invalid String,,,,"
                    return `${protocolIncomingType}R40${msg} `;

                }
                else {
                    objHardness.dimensionParam = 0;
                }

                var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);

                if (objInvalid != undefined && objInvalid.HD425.invalid == true) {
                    //commented by vivek omm 14/05/2020*************
                    //resolve('DM000INVALID FORMAT,PLS REPEAT SAMPLE,,,');
                    //******************************************** */
                    var msg = "Invalid String,,,,"
                    //var msg = "INVALID DATA,RECEIVED,RETRANSMIT DATA,,"
                    return `${protocolIncomingType}R40${msg} `;
                }
                else {

                    var tempTDHD = globalData.arrTHHDrepet.find((k) => k.idsNo == IdsNo);
                    tempTDHD.flag = true;
                    tempTDHD.oc = tempTDHD.oc + 1;
                    /************************************************************* */
                    console.log(tempTDHD);


                    if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                        var tempLimObj = globalData.arr_limits.find((k) => k.idsNo == IdsNo);
                        var intNos = tempLimObj.Hardness.noOfSamples;
                        var objIncompIdHardness = globalData.hardnessIncompleteId.find(
                            (sr) => sr.idsNo == IdsNo
                        );
                        var objHardness = globalData.arrHardness425.find(
                            (ht) => ht.idsNo == IdsNo
                        );
                        var productObj = globalData.arrIdsInfo.find(
                            (k) => k.Sys_IDSNo == selectedIds
                        );
                        if (objHardness.sampleNo >= intNos) {
                            //console.log(globalData.hardnessIncompleteId);
                            await hardnessData.saveHardnessData(
                                objIncompIdHardness.incompRepSerNo,
                                IdsNo
                            );
                            // Clear flag for Incomplete remark on weighment complete like (test aborted, balance off, Auto logout);
                            if (globalData.arrIncompleteRemark != undefined) {
                                globalData.arrIncompleteRemark = globalData.arrIncompleteRemark.filter(
                                    (k) => k.IdsNo != IdsNo
                                );
                            }
                            var selectedIds;
                            var IPQCObject = globalData.arr_IPQCRelIds.find(
                                (k) => k.idsNo == IdsNo
                            );
                            if (IPQCObject != undefined) {
                                selectedIds = IPQCObject.selectedIds;
                            } else {
                                selectedIds = IdsNo;
                            }
                            var objUpdateValidation = {
                                str_tableName: "tbl_cubical",
                                data: [{ str_colName: "Sys_Validation", value: 0 }],
                                condition: [{ str_colName: "Sys_IDSNo", value: selectedIds }],
                            };

                            await database.update(objUpdateValidation);
                            let objActivity = {};
                            Object.assign(
                                objActivity,
                                { strUserId: tempUserObject.UserId },
                                { strUserName: tempUserObject.UserName },
                                { activity: "Hardness Weighment Completed on IDS" + IdsNo }
                            );
                            await objActivityLog.ActivityLogEntry(objActivity);
                            objHardness.sampleNo = 0;
                            var response = `${protocolIncomingType}R3,,,,,`;
                            objInstrumentUsage.InstrumentUsage(
                                "Hardness",
                                IdsNo,
                                "tbl_instrumentlog_hardness",
                                "",
                                "completed"
                            );
                            objMonitor.monit({
                                case: "BL",
                                idsNo: IdsNo,
                                data: { test: "HARDNESS", flag: "COMPLETED" },
                            });
                            return response;
                        } else {
                            // var response = `${ protocolIncomingType } R3,,,,, `;
                            // resolve(response);
                            //HR0<>,<>,<>,<>,<>,
                            objMonitor.monit({
                                case: "HDT",
                                idsNo: IdsNo,
                                data: { sample: objHardness.sampleNo, flag: "start" },
                            });
                            console.log(globalData.arrHardness425[0]);
                            var HRDProtocol =
                                `${protocolIncomingType}R0` +
                                objHardness.sampleNo +
                                " Samples Received,,,,,";
                            return HRDProtocol;
                        }
                    } else {
                        console.log("REPEAT_COUNT FOR TDHD000");
                        return "+";
                    }
                }
            }
        } catch (err) {
            console.log(err);
        }
    }

    async insertBulkWeighmentHardnessErweka_125(IdsNo, protocol) {
        try {
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            // var actualProtocol = protocol;
            var tempThickVal = 0;
            var tempHardVal = 0;
            var tempDimenVal = 0;
            let now = new Date();
            var protocolValue = protocol.substring(0, 5);// starting 5 character
            var protocolValueData = protocol.substring(5);// starting 5 character
            var protocolIncomingType = protocolValue.substring(0, 1);//Check incoming Protocol is from "T" or "H"
            //var hardnessReading = protocol.substring(0, 7);
            var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var objHardness = globalData.arrHardness425.find(ht => ht.idsNo == IdsNo);
            var productlimits = globalData.arr_limits.find(al => al.idsNo == IdsNo);

            if (protocolValue != "TD000" && protocolValue != "HD000" && protocolValue != "ED000") {
                /**
                * @description We are here setting TD000 and HD000 to false
                */


                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }

                var includeSemiColon = protocolValueData.includes(";");
                if (includeSemiColon == true) {
                    //addede by vivek on 19-07-2020 as per discussion with rahul sir if non printable chrecter is received from 
                    //instrument then  display Invalid String message on IDS.
                    var pattern = /[^\x20-\x7E]/g;
                    //removed Last 2 chrecters of checksum values
                    var tempprotocolValueData = protocolValueData.substring(0, protocolValueData.length - 2).trim();
                    if (pattern.test(tempprotocolValueData)) {
                        var msg = "Invalid String,,,,"
                        //var msg = "INVALID DATA,RECEIVED,RETRANSMIT DATA,,"
                        includeSemiColon = false
                        return `${protocolIncomingType}R40${msg}`;
                    }
                    else {
                        var valuesRecevied = protocolValueData.split(';');//String will be split by ';' ex:  99999.00; 99999.00;4 : [0]-thicknes,[1]-dimension,[2]-Hardness
                        if (valuesRecevied.length < 2) {
                            // resolve('DM000INVALID FORMAT,PLS REPEAT SAMPLE,,,');
                            // objHardness.sampleNo = objHardness.sampleNo - 1;

                            var msg = "Invalid String,,,,"
                            //var msg = "INVALID DATA,RECEIVED,RETRANSMIT DATA,,"
                            return `${protocolIncomingType}R40${msg}`;

                        }
                        const objBulkInvalid = new bulkInvalid();
                        objBulkInvalid.invalidObj.idsNo = IdsNo;
                        objBulkInvalid.invalidObj.HD125.invalid = false;
                        objBulkInvalid.invalidObj.HD125.invalidMsg = "";
                        Object.assign(objInvalid, objBulkInvalid.invalidObj);
                        objHardness.sampleNo = objHardness.sampleNo + 1;
                    }
                    //*********************************************************************************************************** */
                }
                else {
                    includeSemiColon = false;
                }
                if (includeSemiColon == true) {

                    // else {
                    tempThickVal = valuesRecevied[0].trim();//Thickness value
                    tempDimenVal = valuesRecevied[1].trim();//Dimension value
                    // tempHardVal = valuesRecevied[2].split("N")[0].trim();//Hardness value
                    tempHardVal = valuesRecevied[2].split(/[NRnr]+/)[0].trim();//Hardness value 
                    tempHardVal == '' ? tempHardVal = 0 : tempHardVal = valuesRecevied[2].split(/[NRnr]+/)[0].trim();
                    // if (tempThickVal != "99999.00" && tempThickVal != "99998.00" && tempThickVal != "99999" &&  tempThickVal != "99998") {
                    objHardness.thicknessVal = tempThickVal;
                    objHardness.thicknessDecimal = 2;
                    // }
                    // else {
                    //     objHardness.thicknessVal = 0;
                    //     objHardness.thicknessDecimal = 0;

                    // }

                    // if (tempDimenVal != "99999.00" && tempDimenVal != "99998.00" && tempDimenVal != "99999" && tempDimenVal != "99998") {
                    objHardness.dimensionVal = tempDimenVal;
                    objHardness.dimensionDecimal = 2;
                    // }
                    // else {
                    //     objHardness.dimensionVal = 0;
                    //     objHardness.dimensionDecimal = 0;

                    // }

                    // if (tempHardVal != "99999.00" && tempHardVal != "99998.00" && tempHardVal != "99999" && tempHardVal != "99998") {
                    objHardness.hardnessVal = tempHardVal;
                    objHardness.hardnessDecimal = 0;
                    // }
                    // else {
                    //     objHardness.hardnessVal = 0;
                    //     objHardness.hardnessDecimal = 0;

                    // }


                    // Checking for Invalid strings
                    var msg = "";
                    var isThickValid = true;
                    var isDimensionsValid = true;
                    var isHardnessValid = true;
                    var isValidCheck = true;
                    // isThickValid = parseFloat(objHardness.thicknessVal);
                    // isThickValid = isThickValid.toString();
                    // if (isThickValid == 'NaN') {
                    //     isValidCheck = false;
                    //     msg = "INVALID THICKNESS,VALUE PLS REPEAT,SAME SAMPLE,,";
                    // }
                    // isDimensionsValid = parseFloat(objHardness.dimensionVal);
                    // isDimensionsValid = isDimensionsValid.toString();
                    // if (isDimensionsValid == 'NaN') {
                    //     isValidCheck = false;
                    //     msg = "INVALID DIMENSION,VALUE PLS REPEAT,SAME SAMPLE,,";
                    // }
                    isHardnessValid = parseFloat(objHardness.hardnessVal);
                    //isHardnessValid = isHardnessValid.toString();
                    /**
                     * @date 11/03/2021 PRADIP
                     * @comment Here code is commented for checking invalid for first sample of hardness, now on
                     *  hardness will  not compulsion from string as well as in product parameters
                     */
                    // if ((objHardness.sampleNo == 1) && (isHardnessValid == 99999 || isHardnessValid == 99998.00)) {
                    //     isValidCheck = false;
                    //     // msg = "INVALID HARDNESS,VALUE PLS REPEAT,SAME SAMPLE,,";
                    //     msg = "Invalid String,,,,"
                    //     //msg = "INVALID DATA,RECEIVED,RETRANSMIT DATA,,"
                    // }
                    var HardnessUnit = productlimits.Hardness == undefined ? 'N' : productlimits.Hardness.unit;
                    //var strHardnessDp = productlimits.Hardness.dp

                    if (!isValidCheck) {
                        // resolve(`DM000${msg}`);
                        objHardness.sampleNo = objHardness.sampleNo - 1;
                        return `${protocolIncomingType}R40${msg}`;

                    } else {
                        // if (objHardness.hardnessVal != 0 || objHardness.dimensionVal != 0 || objHardness.thicknessVal != 0) {
                        var doMasterEntry = (objHardness.sampleNo == 1) ? true : false;
                        //added by vivek on 08-11-2019
                        var tempLimObj = globalData.arr_limits.find(k => k.idsNo == IdsNo);
                        var intNos = 0;
                        if (tempLimObj.Hardness != undefined) {
                            intNos = tempLimObj.Hardness.noOfSamples;
                        } else if (tempLimObj.Thickness != undefined) {
                            intNos = tempLimObj.Thickness.noOfSamples;
                        } else if (tempLimObj.Breadth != undefined) {
                            intNos = tempLimObj.Breadth.noOfSamples;
                        } else if (tempLimObj.Length != undefined) {
                            intNos = tempLimObj.Length.noOfSamples;
                        } else {
                            intNos = tempLimObj.Diameter.noOfSamples;
                        }
                        // (if (objHardness.sampleNo = intNos)) this condition is added by vivek on 08-1-2019 
                        if (objHardness.sampleNo <= intNos) {
                            if (doMasterEntry == true) {
                                let objActivity = {};
                                Object.assign(objActivity,
                                    { strUserId: tempUserObject.UserId },
                                    { strUserName: tempUserObject.UserName },
                                    { activity: 'Hardness Weighment Started on IDS' + IdsNo });
                                await objActivityLog.ActivityLogEntry(objActivity);
                                var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);

                                const checkMasterData = {
                                    str_tableName: 'tbl_tab_masterhtd_incomplete',
                                    data: 'MAX(MstSerNo) AS SeqNo',
                                    condition: [
                                        { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                                        { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                                        { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                                        { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                                        { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                                        { str_colName: 'Idsno', value: IdsNo, comp: 'eq' },
                                    ]
                                }
                                // console.log("tbl_tab_masterhtd_incomplete  1 :" + checkMasterData);
                                var result = await database.select(checkMasterData);
                                var objIncompIdHardness = globalData.hardnessIncompleteId.find(sr => sr.idsNo == IdsNo);
                                var intMstSerNo;
                                if (result[0][0].SeqNo == null) {
                                    intMstSerNo = 1;
                                    objIncompIdHardness.incompRepSerNo = intMstSerNo;
                                } else {
                                    var newMstSerNo = result[0][0].SeqNo + 1;
                                    intMstSerNo = newMstSerNo;
                                    objIncompIdHardness.incompRepSerNo = intMstSerNo;
                                }

                                /***  AS PER shraddhanands and vinod powade bredth will always perform on Vernier so we are not checking it in
                                 Multiparameter hardness **/
                                // if (productlimits.Breadth != undefined) {
                                //     objHardness.colName = "Breadth";
                                //     objHardness.opNominal = productlimits.Breadth.nominal;
                                //     objHardness.opNegTol = productlimits.Breadth.T2Neg;
                                //     objHardness.opPosTol = productlimits.Breadth.T2Pos;
                                // }
                                // else
                                if (productlimits.Length != undefined) {
                                    objHardness.colName = "Length";
                                    objHardness.opNominal = productlimits.Length.nominal;
                                    objHardness.opNegTol = productlimits.Length.T2Neg;
                                    objHardness.opPosTol = productlimits.Length.T2Pos;
                                }
                                else if (productlimits.Diameter != undefined) {
                                    objHardness.colName = "Diameter";
                                    objHardness.opNominal = productlimits.Diameter.nominal;
                                    objHardness.opNegTol = productlimits.Diameter.T2Neg;
                                    objHardness.opPosTol = productlimits.Diameter.T2Pos;
                                }

                                else {
                                    objHardness.colName = "NA";
                                    objHardness.opNominal = 0;
                                    objHardness.opNegTol = 0;
                                    objHardness.opPosTol = 0;
                                }

                                if (productlimits.Thickness == undefined) {
                                    objHardness.thicknessNom = 0;
                                    objHardness.thicknesneg = 0;
                                    objHardness.thicknespos = 0;
                                } else {
                                    objHardness.thicknessNom = productlimits.Thickness.nominal;
                                    objHardness.thicknesneg = productlimits.Thickness.T2Neg;
                                    objHardness.thicknespos = productlimits.Thickness.T2Pos;
                                }
                                var side = "NA";
                                if (productObj.Sys_RotaryType == "Single") {
                                    side = "NA";
                                }
                                else {
                                    if (productlimits.Hardness != undefined) {
                                        side = productlimits.Hardness.side == "L" ? "LHS" : "RHS";
                                    } else {
                                        side = 'LHS';
                                    }
                                }

                                var masterIncopleteData = {
                                    str_tableName: 'tbl_tab_masterhtd_incomplete',
                                    data: [
                                        { str_colName: 'MstSerNo', value: objIncompIdHardness.incompRepSerNo },
                                        { str_colName: 'InstruId', value: 1 },
                                        { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                        { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                        { str_colName: 'ProductType', value: ProductType.productType },
                                        { str_colName: 'Idsno', value: IdsNo },
                                        { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                        { str_colName: 'BalanceId', value: productObj.Sys_BalID },
                                        { str_colName: 'VernierId', value: productObj.Sys_VernierID },
                                        { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                        { str_colName: 'UserId', value: tempUserObject.UserId },
                                        { str_colName: 'UserName', value: tempUserObject.UserName },
                                        { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                                        { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                                        { str_colName: 'Side', value: side },
                                        { str_colName: 'Qty', value: intNos },
                                        { str_colName: 'Unit', value: HardnessUnit },
                                        { str_colName: 'DecimalPoint', value: objHardness.hardnessDecimal },
                                        { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                        { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                        { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                        { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                        { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                        { str_colName: 'HardnessID', value: currentCubicle.Sys_HardID },
                                        { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                        { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                        { str_colName: 'IsArchived', value: 0 },
                                        { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                        { str_colName: 'Version', value: productObj.Sys_Version },
                                        { str_colName: 'ColHeadDOLOBO', value: objHardness.colName },
                                        { str_colName: 'NomThick', value: objHardness.thicknessNom },
                                        { str_colName: 'PosTolThick', value: objHardness.thicknespos },
                                        { str_colName: 'NegTolThick', value: objHardness.thicknesneg },
                                        { str_colName: 'NomHard', value: productlimits.Hardness == undefined ? 0 : productlimits.Hardness.nominal },
                                        { str_colName: 'PosTolHard', value: productlimits.Hardness == undefined ? 0 : productlimits.Hardness.T1Pos },
                                        { str_colName: 'NegTolHard', value: productlimits.Hardness == undefined ? 0 : productlimits.Hardness.T1Neg },
                                        { str_colName: 'NomDOLOBO', value: objHardness.opNominal },
                                        { str_colName: 'PosTolDOLOBO', value: objHardness.opPosTol },
                                        { str_colName: 'NegTolDOLOBO', value: objHardness.opNegTol },
                                        { str_colName: 'GraphType', value: productlimits.Hardness == undefined ? 0 : productlimits.Hardness.isonstd[0] },
                                        { str_colName: 'RepoLabel11', value: currentCubicle.Sys_Validation },
                                        { str_colName: 'Area', value: productObj.Sys_Area },
                                        { str_colName: 'Lot', value: objLotData.LotNo },
                                        { str_colName: 'Stage', value: productObj.Sys_Stage },
                                        { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                        { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                        { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                        { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                        { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },

                                    ]
                                }
                                await clspowerbackup.insertPowerBackupData(productObj, protocolIncomingType, tempUserObject, IdsNo, 'htd', 'Erweka TBH-125', "Hardness");
                                var masterSrno = await database.save(masterIncopleteData);

                                const getRepsrNo = {
                                    str_tableName: 'tbl_tab_masterhtd_incomplete',
                                    data: 'MAX(RepSerNo) AS RepSerNo',
                                    condition: [
                                        { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                                        { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                                        { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                                        { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                                        { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                                        { str_colName: 'Idsno', value: IdsNo, comp: 'eq' },
                                    ]
                                }

                                var res = await database.select(getRepsrNo);
                                let objUpdatepowerbackup = {
                                    str_tableName: 'tbl_powerbackup',
                                    data: [
                                        { str_colName: 'Incomp_RepSerNo', value: res[0][0].RepSerNo }
                                    ],
                                    condition: [
                                        { str_colName: 'Idsno', value: IdsNo },
                                        { str_colName: 'Sys_BFGCode', value: productObj.Sys_BFGCode },
                                        { str_colName: 'Sys_Batch', value: productObj.Sys_Batch }

                                    ]
                                }
                                await database.update(objUpdatepowerbackup);

                                var objIncompIdHardness = globalData.hardnessIncompleteId.find(sr => sr.idsNo == IdsNo);
                                var objHardness = globalData.arrHardness425.find(ht => ht.idsNo == IdsNo);
                                await objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', 'Hardness', 'started')
                                objIncompIdHardness.incompRepSerNo = masterSrno[0].insertId;
                                //console.log("Third",objHardness);
                                const insertDetailObj = {
                                    str_tableName: 'tbl_tab_detailhtd_incomplete',
                                    data: [
                                        { str_colName: 'RepSerNo', value: objIncompIdHardness.incompRepSerNo },
                                        { str_colName: 'MstSerNo', value: 0 },
                                        { str_colName: 'RecSeqNo', value: objHardness.sampleNo },
                                        { str_colName: 'DataValueThick', value: objHardness.thicknessNom == 0 ? 0 : objHardness.thicknessVal },
                                        { str_colName: 'DataValueDOLOBO', value: objHardness.opNominal == 0 ? 0 : objHardness.dimensionVal },
                                        { str_colName: 'DataValueHard', value: objHardness.hardnessVal == 0 ? 0 : objHardness.hardnessVal },
                                        { str_colName: 'DecimalPointThick', value: objHardness.thicknessNom == 0 ? 0 : objHardness.thicknessDecimal },
                                        { str_colName: 'DecimalPointDOLOBO', value: objHardness.opNominal == 0 ? 0 : objHardness.dimensionDecimal },
                                        { str_colName: 'DecimalPointHard', value: objHardness.hardnessDecimal },
                                        { str_colName: 'idsNo', value: parseInt(objHardness.idsNo) }

                                    ]
                                }
                                const DetailsEntries = {
                                    str_tableName: "tbl_tab_detailhtd_incomplete",
                                    data: 'MAX(RecSeqNo) AS SeqNo',
                                    condition: [
                                        { str_colName: 'RepSerNo', value: objIncompIdHardness.incompRepSerNo, comp: 'eq' }
                                    ]
                                }
                                var tabDetails = await database.select(DetailsEntries)
                                if (tabDetails[0][0].SeqNo == null) {
                                    var entries = 1
                                } else {
                                    var entries = tabDetails[0][0].SeqNo + 1
                                }

                                if (entries == objHardness.sampleNo) {
                                    await database.save(insertDetailObj)
                                }

                                var tempObj = globalData.arrIncompleteRemark.find(k => k.IdsNo == IdsNo);
                                if (tempObj == undefined) {
                                    globalData.arrIncompleteRemark.push({ weighment: true, RepoSr: masterSrno[0].insertId, Type: 7, IdsNo: IdsNo });
                                }
                                else {
                                    tempObj.weighment = true;
                                    tempObj.RepoSr = masterSrno[0].insertId;
                                    tempObj.Type = 7;
                                    //globalData.arrIncompleteRemark.IdsNo = IdsNo;
                                }


                            } else {
                                if (objHardness.sampleNo > 0) {
                                    var objHardness = globalData.arrHardness425.find(ht => ht.idsNo == IdsNo);
                                    var objIncompIdHardness = globalData.hardnessIncompleteId.find(sr => sr.idsNo == IdsNo);
                                    const insertDetailObj = {
                                        str_tableName: 'tbl_tab_detailhtd_incomplete',
                                        data: [
                                            { str_colName: 'RepSerNo', value: objIncompIdHardness.incompRepSerNo },
                                            { str_colName: 'MstSerNo', value: 0 },
                                            { str_colName: 'RecSeqNo', value: objHardness.sampleNo },
                                            { str_colName: 'DataValueThick', value: objHardness.thicknessNom == 0 ? 0 : objHardness.thicknessVal },
                                            { str_colName: 'DataValueDOLOBO', value: objHardness.opNominal == 0 ? 0 : objHardness.dimensionVal },
                                            { str_colName: 'DataValueHard', value: objHardness.hardnessVal },
                                            { str_colName: 'DecimalPointThick', value: objHardness.thicknessNom == 0 ? 0 : objHardness.thicknessDecimal },
                                            { str_colName: 'DecimalPointDOLOBO', value: objHardness.opNominal == 0 ? 0 : objHardness.dimensionDecimal },
                                            { str_colName: 'DecimalPointHard', value: objHardness.hardnessDecimal },
                                            { str_colName: 'idsNo', value: parseInt(objHardness.idsNo) }

                                        ]
                                    }
                                    const DetailsEntries = {
                                        str_tableName: "tbl_tab_detailhtd_incomplete",
                                        data: 'MAX(RecSeqNo) AS SeqNo',
                                        condition: [
                                            { str_colName: 'RepSerNo', value: objIncompIdHardness.incompRepSerNo, comp: 'eq' }
                                        ]
                                    }
                                    var tabDetails = await database.select(DetailsEntries)
                                    if (tabDetails[0][0].SeqNo == null) {
                                        var entries = 1
                                    } else {
                                        var entries = tabDetails[0][0].SeqNo + 1
                                    }

                                    if (entries == objHardness.sampleNo) {
                                        await database.save(insertDetailObj)
                                    }
                                    else {
                                        //logFromPC.addtoProtocolLog(`sample no ${entries} recieved instead of ${objHardness.sampleNo} reading`)
                                        objHardness.sampleNo = objHardness.sampleNo - 1
                                    }

                                    var tempObj = globalData.arrIncompleteRemark.find(k => k.IdsNo == IdsNo);
                                    if (tempObj == undefined) {
                                        globalData.arrIncompleteRemark.push({ weighment: true, RepoSr: objIncompIdHardness.incompRepSerNo, Type: 7, IdsNo: IdsNo });
                                    }
                                    else {
                                        tempObj.weighment = true;
                                        tempObj.RepoSr = objIncompIdHardness.incompRepSerNo;
                                        tempObj.Type = 7;
                                        //globalData.arrIncompleteRemark.IdsNo = IdsNo;
                                    }
                                }

                            }
                        }
                    }
                    return protocolValue;
                }
                else {
                    // resolve('DM000INVALID FORMAT,PLS REPEAT SAMPLE,,,');
                    return protocolValue;
                }

            }
            else {

                var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);

                if (objInvalid != undefined && objInvalid.HD125.invalid == true) {
                    // resolve('DM000INVALID FORMAT,PLS REPEAT SAMPLE,,,');
                    var msg = "Invalid String,,,,"
                    //var msg = "INVALID DATA,RECEIVED,RETRANSMIT DATA,,"
                    return `${protocolIncomingType}R40${msg}`;
                } else {
                    /**
                    * @description We are here setting TD000 and HD000 to true
                    */
                    var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                    tempTDHD.flag = true;
                    tempTDHD.oc = tempTDHD.oc + 1;
                    /************************************************************* */
                    console.log(tempTDHD)
                    if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                        var tempLimObj = globalData.arr_limits.find(k => k.idsNo == IdsNo);
                        var intNos = 0;
                        if (tempLimObj.Hardness != undefined) {
                            intNos = tempLimObj.Hardness.noOfSamples;
                        } else if (tempLimObj.Thickness != undefined) {
                            intNos = tempLimObj.Thickness.noOfSamples;
                        } else if (tempLimObj.Breadth != undefined) {
                            intNos = tempLimObj.Breadth.noOfSamples;
                        } else if (tempLimObj.Length != undefined) {
                            intNos = tempLimObj.Length.noOfSamples;
                        } else {
                            intNos = tempLimObj.Diameter.noOfSamples;
                        }
                        var objIncompIdHardness = globalData.hardnessIncompleteId.find(sr => sr.idsNo == IdsNo);
                        var objHardness = globalData.arrHardness425.find(ht => ht.idsNo == IdsNo);
                        var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                        if (objHardness.sampleNo >= intNos) {
                            //console.log(globalData.hardnessIncompleteId);
                            await hardnessData.saveHardnessData(objIncompIdHardness.incompRepSerNo, IdsNo);
                            // Clear flag for Incomplete remark like (test aborted, balance off, Auto logout);
                            if (globalData.arrIncompleteRemark != undefined) {
                                globalData.arrIncompleteRemark = globalData.arrIncompleteRemark.filter(k => k.IdsNo != IdsNo);
                            }
                            var objUpdateValidation = {
                                str_tableName: "tbl_cubical",
                                data: [
                                    { str_colName: 'Sys_Validation', value: 0 },
                                ],
                                condition: [
                                    { str_colName: 'Sys_IDSNo', value: IdsNo },
                                ]
                            }

                            await database.update(objUpdateValidation);
                            let objActivity = {};
                            Object.assign(objActivity,
                                { strUserId: tempUserObject.UserId },
                                { strUserName: tempUserObject.UserName },
                                { activity: 'Hardness Weighment Completed on IDS' + IdsNo });
                            await objActivityLog.ActivityLogEntry(objActivity);
                            objHardness.sampleNo = 0;
                            let insertedToPowerBackup = globalData.arrHardnessPowerbackupFlag.find(k => k.idsNo == IdsNo);
                            if (insertedToPowerBackup == undefined) {
                                globalData.arrHardnessPowerbackupFlag.push({ idsNo: IdsNo, IsinsertedToPowerBackup: false });
                            }
                            else {
                                insertedToPowerBackup.IsinsertedToPowerBackup = false;
                            }

                            var response = `${protocolIncomingType}R3,,,,,`;
                            await objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', 'completed');
                            objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'HARDNESS', flag: 'COMPLETED' } });
                            return response;
                        } else {
                            // var response = `${protocolIncomingType}R3,,,,,`;
                            // resolve(response);
                            //HR0<>,<>,<>,<>,<>,
                            if (objHardness.sampleNo != 0) {
                                var HRDProtocol = `${protocolIncomingType}R0` + objHardness.sampleNo + " Samples Recived.,,,,,";
                                objMonitor.monit({ case: 'HDT', idsNo: IdsNo, data: { sample: objHardness.sampleNo, flag: 'start' } });
                                const objBulkInvalid = new bulkInvalid();
                                objBulkInvalid.invalidObj.idsNo = IdsNo;
                                objBulkInvalid.invalidObj.HD125.invalid = true;
                                objBulkInvalid.invalidObj.HD125.invalidMsg = "";
                                Object.assign(objInvalid, objBulkInvalid.invalidObj);
                                return HRDProtocol;
                            } else {
                                return '+';
                            }
                        }
                    } else {
                        console.log('REPEAT_COUNT FOR TDHD000');
                        return '+'
                    }
                }
            }
        }
        catch (err) {
            console.log(err);
        }

    }

    async insertHardnessPharmatron(IdsNo, protocol) {
        try {
            var insertedToPowerBackup = globalData.arrHardnessPowerbackupFlag.find(k => k.idsNo == IdsNo);
            if (insertedToPowerBackup == undefined) {
                globalData.arrHardnessPowerbackupFlag.push({ idsNo: IdsNo, IsinsertedToPowerBackup: false });
            }
            else {
                insertedToPowerBackup.IsinsertedToPowerBackup = insertedToPowerBackup.IsinsertedToPowerBackup;
            }
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var protocolValue = protocol.substring(0, 5);// starting 5 character
            var protocolValueData = protocol.substring(5);// starting 5 character
            var protocolIncomingType = protocolValue.substring(0, 1);//here incoming protocol is check T Or H
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var currentCubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var objHardness = globalData.arrHardnessDRSCPharmatron.find(ht => ht.idsNo == IdsNo);
            var productlimits = globalData.arr_limits.find(al => al.idsNo == IdsNo);
            let now = new Date();
            var pattern = /[^\x20-\x7E]/g;

            var side = "NA";
            if (productObj.Sys_RotaryType == "Single") {
                side = "NA";
            }
            else {
                side = productlimits.Hardness.side == "L" ? "LHS" : "RHS";
            }
            //if (protocolValue != protocolIncomingType + "D000" && protocolValue != "HD000" && protocolValue != "ED000") {
            if (protocolValue != protocolIncomingType + "D000") {


                /**
                * @description We are here setting TD000 and HD000 to false
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }
                /************************************************************* */


                var IsinsertedToPowerBackup = globalData.arrHardnessPowerbackupFlag.find(k => k.idsNo == IdsNo);

                // if (protocolValue == protocolIncomingType + "D001" && !IsinsertedToPowerBackup.IsinsertedToPowerBackup) {

                //     IsinsertedToPowerBackup.IsinsertedToPowerBackup = true;
                // }

                if (protocol.includes('Hardness') == true) {
                    objHardness.oc = objHardness.oc + 1;
                }
                if (objHardness.oc == 2) {
                    // console.log('IN');
                    if (protocol.includes('Valid Samples') == true) {
                        objHardness.hardnessFlag = true;
                        objHardness.masterEntryFlag = true;
                        await objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', 'Hardness', 'started');
                    }
                    if (objHardness.hardnessFlag == true) {
                        if (!protocol.includes('Valid Samples')) {

                            var strProtocol = protocol.replace(/\s\s+/g, ' ');
                            var hardnessVal = strProtocol.split(" ")[2];

                            //if (hardnessVal.substring(0, 1) != "n" && arrProtocol.length != 1) {
                            // var temhardnessVal = hardnessVal.substring(0, hardnessVal.length - 2)
                            // if (pattern.test(temhardnessVal)) { //for non printable chrecter
                            //     var msg = "INVALID STRING,,,,"
                            //     //var msg = "INVALID DATA,RECEIVED,RETRANSMIT DATA,,"
                            //     objHardness.oc = 0
                            //     return `${protocolIncomingType}R40${msg}`;
                            // } Remove by Pradip 24/08/2020 Due to invalid for all sample

                            if (!isNaN(parseFloat(hardnessVal))) {

                                if (objHardness.masterEntryFlag == true && objHardness.capacityFlag == false) {
                                    // var decimalPoint = await calculateDp.precision(objHardness.arr[0]);
                                    //var decimalPoint = await calculateDp.precision(hardnessVal);
                                    var res = await proObj.productData(productObj)
                                    var objArrLimits = globalData.arrIdsInfo.find(k => k.idsNo == IdsNo);

                                    await clspowerbackup.insertPowerBackupData(currentCubicalObj, protocolIncomingType, tempUserObject, IdsNo, '7', 'Dr Schleuniger', "Hardness");
                                    const insertIncompleteObj = {
                                        str_tableName: 'tbl_tab_master7_incomplete',
                                        data: [
                                            { str_colName: 'MstSerNo', value: 1 },
                                            { str_colName: 'InstruId', value: 3 },
                                            { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                            { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                            { str_colName: 'ProductType', value: objProductType.productType },
                                            { str_colName: 'Qty', value: productlimits.Hardness.noOfSamples },
                                            { str_colName: 'GrpQty', value: 0 },
                                            { str_colName: 'GrpFreq', value: 0 },
                                            { str_colName: 'Idsno', value: IdsNo },
                                            { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                            { str_colName: 'BalanceId', value: currentCubicalObj.Sys_BalID },
                                            //{ str_colName: 'BalanceNo', value: productObj.Sys_BalID },
                                            { str_colName: 'VernierId', value: currentCubicalObj.Sys_VernierID },
                                            //{ str_colName: 'VernierNo', value: productObj.Sys_BalID },
                                            { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                            { str_colName: 'UserId', value: tempUserObject.UserId },
                                            { str_colName: 'UserName', value: tempUserObject.UserName },
                                            { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                                            { str_colName: 'Side', value: side },
                                            { str_colName: 'Unit', value: res[1]['Param7_Unit'] },
                                            { str_colName: 'DecimalPoint', value: res[1]['Param7_Dp'] },
                                            { str_colName: 'WgmtModeNo', value: 7 },
                                            { str_colName: 'Nom', value: res[1]['Param7_Nom'] },
                                            { str_colName: 'T1NegTol', value: res[1]['Param7_T1Neg'] },
                                            { str_colName: 'T1PosTol', value: res[1]['Param7_T1Pos'] },
                                            // { str_colName: 'T2NegTol', value: res[1][paramT2Neg] },
                                            // { str_colName: 'T2PosTol', value: res[1][paramT2Pos] },
                                            { str_colName: 'limitOn', value: res[1]['Param7_LimitOn'].readUIntLE() },
                                            // { str_colName: 'T1NMTTab', value: 0 },
                                            // { str_colName: 'T1NegEmpty', value:  },
                                            // { str_colName: 'T1PosEmpty', value:  },
                                            // { str_colName: 'T2NegEmpty', value:  },
                                            // { str_colName: 'T2PosEmpty', value:  },
                                            // { str_colName: 'NomNet', value:  },
                                            // { str_colName: 'T1NegNet', value:  },
                                            // { str_colName: 'T1PosNet', value:  },
                                            // { str_colName: 'T2NegNet', value:  },
                                            // { str_colName: 'T2PosNet', value:  },
                                            { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                            { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                            { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                            { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                            { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                            { str_colName: 'FriabilityID', value: currentCubicalObj.Sys_FriabID },
                                            { str_colName: 'HardnessID', value: currentCubicalObj.Sys_HardID },
                                            { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                            { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                            { str_colName: 'RepoLabel10', value: res[0].NominalNomenclature },
                                            { str_colName: 'RepoLabel11', value: productObj.Sys_Validation }, // this will store wether the test is validation or not 
                                            // { str_colName: 'RepoLabel12', value:  },
                                            // { str_colName: 'RepoLabel13', value:  },
                                            { str_colName: 'PrintNo', value: 0 },
                                            { str_colName: 'IsArchived', value: 0 },
                                            { str_colName: 'GraphType', value: res[1]['Param7_IsOnStd'].readUIntLE() },
                                            { str_colName: 'BatchComplete', value: 0 },
                                            { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                            { str_colName: 'Version', value: productObj.Sys_Version },
                                            { str_colName: 'Lot', value: objLotData.LotNo },
                                            { str_colName: 'Area', value: productObj.Sys_Area },
                                            { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                            { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                            { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                            { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                            { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                                        ]
                                    }
                                    console.log(insertIncompleteObj)
                                    var masterRes = await database.save(insertIncompleteObj);

                                    const getRepsrNo = {
                                        str_tableName: 'tbl_tab_master7_incomplete',
                                        data: 'MAX(RepSerNo) AS RepSerNo',
                                        condition: [
                                            { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                                            { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                                            { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                                            { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                                            { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                                            { str_colName: 'Idsno', value: IdsNo, comp: 'eq' },
                                        ]
                                    }

                                    // console.log("tbl_tab_masterhtd_incomplete  1 :" + checkMasterData);
                                    var res = await database.select(getRepsrNo);
                                    let objUpdatepowerbackup = {
                                        str_tableName: 'tbl_powerbackup',
                                        data: [
                                            { str_colName: 'Incomp_RepSerNo', value: res[0][0].RepSerNo }
                                        ],
                                        condition: [
                                            { str_colName: 'Idsno', value: IdsNo },
                                            { str_colName: 'Sys_BFGCode', value: productObj.Sys_BFGCode },
                                            { str_colName: 'Sys_Batch', value: productObj.Sys_Batch }

                                        ]
                                    }
                                    await database.update(objUpdatepowerbackup);



                                    let objActivity = {};
                                    Object.assign(objActivity,
                                        { strUserId: tempUserObject.UserId },
                                        { strUserName: tempUserObject.UserName },
                                        { activity: 'Hardness Weighment Started on IDS' + IdsNo });
                                    await objActivityLog.ActivityLogEntry(objActivity);
                                    objHardness.masterEntryFlag = false;
                                    var lastInsertedID = masterRes[0].insertId;
                                    var hardnessVal = hardnessVal.trim(" ");
                                    if (hardnessVal.includes('N')) {
                                        hardnessVal = hardnessVal.split('N')
                                    } else if (hardnessVal.includes('n')) {
                                        hardnessVal = hardnessVal.split('n')
                                    } else if (hardnessVal.includes('R')) {
                                        hardnessVal = hardnessVal.split('R')
                                    } else {
                                        hardnessVal = hardnessVal.split('r')
                                    }
                                    hardnessVal = hardnessVal[0];
                                    if (hardnessVal != "") {
                                        objHardness.arr.push(hardnessVal);
                                        console.log('Array', objHardness.arr)
                                        var decimalPoint;
                                        //var decimalPoint = await calculateDp.precision(hardnessVal);
                                        hardnessVal.split('.')[1] == undefined ? decimalPoint = 0 : decimalPoint = hardnessVal.split('.')[1].length

                                        var detailObj = {
                                            str_tableName: 'tbl_tab_detail7_incomplete',
                                            data: [
                                                { str_colName: 'RepSerNo', value: lastInsertedID },
                                                { str_colName: 'MstSerNo', value: 0 },
                                                { str_colName: 'RecSeqNo', value: 1 },
                                                { str_colName: 'DataValue', value: hardnessVal },
                                                { str_colName: 'DecimalPoint', value: decimalPoint }
                                            ]
                                        }
                                        await database.save(detailObj)

                                        var strupdateDEcimalInMst = `Update tbl_tab_master7_incomplete set DecimalPoint='${decimalPoint}' where RepSerNo='${lastInsertedID}'`
                                        console.log(strupdateDEcimalInMst)
                                        var result = await database.execute(strupdateDEcimalInMst)
                                    }
                                    objHardness.masterId = lastInsertedID;

                                } else {
                                    var hardnessVal = hardnessVal.trim(" ");
                                    if (hardnessVal.includes('N')) {
                                        hardnessVal = hardnessVal.split('N')
                                    } else if (hardnessVal.includes('n')) {
                                        hardnessVal = hardnessVal.split('n')
                                    } else if (hardnessVal.includes('R')) {
                                        hardnessVal = hardnessVal.split('R')
                                    } else {
                                        hardnessVal = hardnessVal.split('r')
                                    }
                                    hardnessVal = hardnessVal[0];
                                    if (hardnessVal != "") {
                                        objHardness.arr.push(hardnessVal);
                                        console.log('Array', objHardness.arr)
                                        var decimalPoint = await calculateDp.precision(hardnessVal);
                                        console.log(productlimits.Hardness.noOfSamples, objHardness.arr.length);
                                        if (productlimits.Hardness.noOfSamples >= objHardness.arr.length) {
                                            var detailObj = {
                                                str_tableName: 'tbl_tab_detail7_incomplete',
                                                data: [
                                                    { str_colName: 'RepSerNo', value: objHardness.masterId },
                                                    { str_colName: 'MstSerNo', value: 0 },
                                                    { str_colName: 'RecSeqNo', value: objHardness.arr.length },
                                                    { str_colName: 'DataValue', value: hardnessVal },
                                                    { str_colName: 'DecimalPoint', value: decimalPoint }
                                                ]
                                            }

                                            await database.save(detailObj)

                                        }
                                    }
                                }
                            }
                            //}
                        }
                    }
                }
                if (protocol.includes('Signature') == true) {
                    objHardness.hardnessFlag = false;
                }
                return protocolValue;
            } else {
                /**
                * @description We are here setting TD000 and HD000 to true
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                console.log(tempTDHD)
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    if (productlimits.Hardness.noOfSamples > objHardness.arr.length) {
                        var remSample = parseInt(productlimits.Hardness.noOfSamples) - objHardness.arr.length;
                        var HRDProtocol = `${protocolIncomingType}R0` + remSample + " Samples Pending,,,,,";
                        objHardness.capacityFlag = true;
                        objHardness.hardnessFlag = false;
                        objHardness.oc = 0
                        return HRDProtocol;
                    } else {
                        var remarkRes = await hardnessData.saveHardnessData8M(objHardness.masterId, IdsNo);
                        let objActivity = {};
                        await objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', '', 'completed');
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Hardness Weighment Completed on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        var appendProtocol = 'R1';
                        if (remarkRes == 'Complies') {
                            appendProtocol = 'R1';
                        } else {
                            appendProtocol = 'R2';
                        }
                        return `${protocolIncomingType}${appendProtocol},,,,,`;
                    }
                } else {
                    console.log('REPEAT_COUNT FOR TDHD000');
                    return '+'
                }
            }
        } catch (err) {
            var tempHardnessReadings = globalData.arrHardnessDRSCPharmatron.find(k => k.idsNo == IdsNo)
            if (tempHardnessReadings == undefined) {
                globalData.arrHardnessDRSCPharmatron.push({ idsNo: IdsNo, oc: 0, hardnessFlag: false, arr: [], capacityFlag: false, masterId: 0, masterEntryFlag: false });
            } else {
                tempHardnessReadings.oc = 0;
                tempHardnessReadings.arr = [];
                tempHardnessReadings.capacityFlag = false;
                tempHardnessReadings.hardnessFlag = false;
                tempHardnessReadings.masterId = 0;
                tempHardnessReadings.masterEntryFlag = false;
            }
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log("error from Hardness in Bulkweighment", err)
            throw new Error(err);
        }
    }

    async insertBulkWeighmentHardnessTH1050S(IdsNo, protocol) {
        try {

            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var protocolValue = protocol.substring(0, 5);// starting 5 character
            var protocolValueData = protocol.substring(5);// starting 5 character
            var protocolIncomingType = protocolValue.substring(0, 1);//here incoming protocol is check T Or H
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            //var currentCubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            var currentCubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            const objHardness = globalData.arrHardnessTH1050.find(ht => ht.idsNo == IdsNo);
            var productlimits = globalData.arr_limits.find(al => al.idsNo == IdsNo);
            let now = new Date();
            var pattern = /[^\x20-\x7E]/g;

            var side = "NA";
            if (productObj.Sys_RotaryType == "Single") {
                side = "NA";
            }
            else {
                side = productlimits.Hardness.side == "L" ? "LHS" : "RHS";
            }

            if (protocolValue != protocolIncomingType + "D000") {


                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }
                /************************************************************* */


                //var objHardnessData = globalData.arrHardnessTH1050.find(ht => ht.idsNo == selectedIds);
                let proto = protocol.substring(0, protocol.length - 2).trim();
                const noofsample = proto.includes("No of Tablets")
                if (noofsample) {
                    let sampleno = proto.split(":")[1].trim();
                    objHardness.sampleno = parseInt(sampleno);
                    console.log(sampleno);
                }

                var SampalData = proto.includes("Hardness( Newton)");
                if (SampalData) {
                    objHardness.masterEntryFlag = true;
                    objHardness.extractSample = true
                    //objHardness.capacityFlag = false
                    await objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', 'Hardness', 'started');

                }

                const min = proto.includes("Minimum");
                if (min) {
                    objHardness.extractSample = false;
                }



                if (objHardness.extractSample) {
                    let sampleArray = proto.replace(/\s\s+/g, ' ').trim().split(' ');

                    let { 0: a, [sampleArray.length - 1]: b } = sampleArray;
                    console.log(`sample no ${a} = ${b}`);
                    if (!isNaN(parseInt(b))) {

                        if (objHardness.masterEntryFlag == true && objHardness.capacityFlag == false) {
                            var res = await proObj.productData(productObj)
                            var objArrLimits = globalData.arrIdsInfo.find(k => k.idsNo == IdsNo);
                            var Dp = res[1]['Param7_Dp'] == undefined ? res[1]['Param7_DP'] : res[1]['Param7_Dp']
                            await clspowerbackup.insertPowerBackupData(currentCubicalObj, protocolIncomingType, tempUserObject, IdsNo, '7', 'TH1050S+', "Hardness");
                            const insertIncompleteObj = {
                                str_tableName: 'tbl_tab_master7_incomplete',
                                data: [
                                    { str_colName: 'MstSerNo', value: 1 },
                                    { str_colName: 'InstruId', value: 3 },
                                    { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                    { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                    { str_colName: 'ProductType', value: objProductType.productType },
                                    { str_colName: 'Qty', value: productlimits.Hardness.noOfSamples },
                                    { str_colName: 'GrpQty', value: 0 },
                                    { str_colName: 'GrpFreq', value: 0 },
                                    { str_colName: 'Idsno', value: IdsNo },
                                    { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                    { str_colName: 'BalanceId', value: currentCubicalObj.Sys_BalID },
                                    { str_colName: 'VernierId', value: currentCubicalObj.Sys_VernierID },
                                    { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                    { str_colName: 'UserId', value: tempUserObject.UserId },
                                    { str_colName: 'UserName', value: tempUserObject.UserName },
                                    { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                                    { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                                    { str_colName: 'Side', value: side },
                                    { str_colName: 'Unit', value: res[1]['Param7_Unit'] },
                                    { str_colName: 'DecimalPoint', value: Dp },
                                    { str_colName: 'WgmtModeNo', value: 7 },
                                    { str_colName: 'Nom', value: res[1]['Param7_Nom'] },
                                    { str_colName: 'T1NegTol', value: res[1]['Param7_T1Neg'] },
                                    { str_colName: 'T1PosTol', value: res[1]['Param7_T1Pos'] },
                                    { str_colName: 'limitOn', value: res[1]['Param7_LimitOn'].readUIntLE() },
                                    { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                    { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                    { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                    { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                    { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                    { str_colName: 'FriabilityID', value: currentCubicalObj.Sys_FriabID },
                                    { str_colName: 'HardnessID', value: currentCubicalObj.Sys_HardID },
                                    { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                    { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                    { str_colName: 'RepoLabel10', value: res[0].NominalNomenclature },
                                    { str_colName: 'RepoLabel11', value: productObj.Sys_Validation },
                                    { str_colName: 'PrintNo', value: 0 },
                                    { str_colName: 'IsArchived', value: 0 },
                                    { str_colName: 'GraphType', value: res[1]['Param7_IsOnStd'].readUIntLE() },
                                    { str_colName: 'BatchComplete', value: 0 },
                                    { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                    { str_colName: 'Version', value: productObj.Sys_Version },
                                    { str_colName: 'Lot', value: objLotData.LotNo },
                                    { str_colName: 'Area', value: productObj.Sys_Area },
                                    { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                    { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                    { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                    { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                    { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                                ]
                            }
                            console.log(insertIncompleteObj)
                            var masterRes = await database.save(insertIncompleteObj);

                            const getRepsrNo = {
                                str_tableName: 'tbl_tab_master7_incomplete',
                                data: 'MAX(RepSerNo) AS RepSerNo',
                                condition: [
                                    { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                                    { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                                    { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                                    { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                                    { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                                    { str_colName: 'Idsno', value: IdsNo, comp: 'eq' },
                                ]
                            }

                            var res = await database.select(getRepsrNo);
                            let objUpdatepowerbackup = {
                                str_tableName: 'tbl_powerbackup',
                                data: [
                                    { str_colName: 'Incomp_RepSerNo', value: res[0][0].RepSerNo }
                                ],
                                condition: [
                                    { str_colName: 'Idsno', value: IdsNo },
                                    { str_colName: 'Sys_BFGCode', value: productObj.Sys_BFGCode },
                                    { str_colName: 'Sys_Batch', value: productObj.Sys_Batch }

                                ]
                            }
                            await database.update(objUpdatepowerbackup);



                            let objActivity = {};
                            Object.assign(objActivity,
                                { strUserId: tempUserObject.UserId },
                                { strUserName: tempUserObject.UserName },
                                { activity: 'Hardness Weighment Started on IDS' + IdsNo });
                            await objActivityLog.ActivityLogEntry(objActivity);
                            objHardness.masterEntryFlag = false;
                            var lastInsertedID = masterRes[0].insertId;
                            var hardnessVal = b;


                            if (hardnessVal != "") {
                                objHardness.arr_reading.push(hardnessVal);
                                console.log('Array', objHardness.arr_reading)
                                var decimalPoint;
                                //var decimalPoint = await calculateDp.precision(hardnessVal);
                                hardnessVal.split('.')[1] == undefined ? decimalPoint = 0 : decimalPoint = hardnessVal.split('.')[1].length

                                var detailObj = {
                                    str_tableName: 'tbl_tab_detail7_incomplete',
                                    data: [
                                        { str_colName: 'RepSerNo', value: lastInsertedID },
                                        { str_colName: 'MstSerNo', value: 0 },
                                        { str_colName: 'RecSeqNo', value: 1 },
                                        { str_colName: 'DataValue', value: hardnessVal },
                                        { str_colName: 'DecimalPoint', value: decimalPoint }
                                    ]
                                }
                                await database.save(detailObj)

                                var strupdateDEcimalInMst = `Update tbl_tab_master7_incomplete set DecimalPoint='${decimalPoint}' where RepSerNo='${lastInsertedID}'`
                                console.log(strupdateDEcimalInMst)
                                var result = await database.execute(strupdateDEcimalInMst)
                            }
                            objHardness.masterId = lastInsertedID;
                            objHardness.capacityFlag = false

                        } else {

                            hardnessVal = b
                            if (hardnessVal != "") {
                                objHardness.arr_reading.push(hardnessVal);
                                console.log('Array', objHardness.arr_reading)
                                var decimalPoint = await calculateDp.precision(hardnessVal);
                                console.log(productlimits.Hardness.noOfSamples, objHardness.arr_reading.length);
                                if (productlimits.Hardness.noOfSamples >= objHardness.arr_reading.length) {
                                    var detailObj = {
                                        str_tableName: 'tbl_tab_detail7_incomplete',
                                        data: [
                                            { str_colName: 'RepSerNo', value: objHardness.masterId },
                                            { str_colName: 'MstSerNo', value: 0 },
                                            { str_colName: 'RecSeqNo', value: objHardness.arr_reading.length },
                                            { str_colName: 'DataValue', value: hardnessVal },
                                            { str_colName: 'DecimalPoint', value: decimalPoint }
                                        ]
                                    }

                                    await database.save(detailObj)

                                }
                            }
                        }
                    }

                    // if (!isNaN(samplenofromstring)) {
                    //     if (objHardnessData.sampleno == samplenofromstring) {
                    //         objHardnessData.extractSample = false;
                    //     }
                    // }




                }


                return protocolValue;
            } else {
                /**
                * @description We are here setting TD000 and HD000 to true
                */
                const objHardne = globalData.arrHardnessTH1050.find(ht => ht.idsNo == IdsNo);
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                console.log(tempTDHD)
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    if (productlimits.Hardness.noOfSamples > objHardness.arr_reading.length) {
                        var remSample = parseInt(productlimits.Hardness.noOfSamples) - objHardness.arr_reading.length;
                        var HRDProtocol = `${protocolIncomingType}R0` + remSample + " Samples Pending,,,,,";
                        objHardness.oc = 0
                        objHardness.capacityFlag = true;
                        return HRDProtocol;
                    } else {

                        var remarkRes = await hardnessData.saveHardnessData8M(objHardness.masterId, IdsNo, "TH1050S+");
                        let objActivity = {};
                        await objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', '', 'completed');
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Hardness Weighment Completed on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        var appendProtocol = 'R1';
                        if (remarkRes == 'Complies') {
                            appendProtocol = 'R1';
                        } else {
                            appendProtocol = 'R2';
                        }
                        return `${protocolIncomingType}${appendProtocol},,,,,`;
                    }
                } else {
                    console.log('REPEAT_COUNT FOR TDHD000');
                    return '+'
                }
            }
        } catch (err) {
            // var tempHardnessReadings = globalData.arrHardnessDRSCPharmatron.find(k => k.idsNo == IdsNo)
            // if (tempHardnessReadings == undefined) {
            //     globalData.arrHardnessDRSCPharmatron.push({ idsNo: IdsNo, oc: 0, hardnessFlag: false, arr: [], capacityFlag: false, masterId: 0, masterEntryFlag: false });
            // } else {
            //     tempHardnessReadings.oc = 0;
            //     tempHardnessReadings.arr = [];
            //     tempHardnessReadings.capacityFlag = false;
            //     tempHardnessReadings.hardnessFlag = false;
            //     tempHardnessReadings.masterId = 0;
            //     tempHardnessReadings.masterEntryFlag = false;
            // }

            const objHardness = globalData.arrHardnessTH1050.find(ht => ht.idsNo == IdsNo);
            if (objHardness == undefined) {
                globalData.arrHardnessTH1050.push({
                    idsNo: IdsNo,
                    arr_heading: [],
                    arr_reading: [],
                    arr_info: [],
                    extractSample: false,
                    sampleno: 0,
                    currentsampleno: 0,
                    masterEntryFlag: false,
                    capacityFlag: false
                });
            } else {
                objHardness.arr_heading = [];
                objHardness.arr_reading = [];
                objHardness.arr_info = [];
            }





            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log("error from Hardness in Bulkweighment", err)
            throw new Error(err);
        }
    }

    async insertHardnessMT50HTOHR(IdsNo, protocol) {
        try {
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var protocolValue = protocol.substring(0, 5);// starting 5 character
            var protocolValueData = protocol.substring(5);// starting 5 character
            var protocolIncomingType = protocolValue.substring(0, 1);//here incoming protocol is check T Or H
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var currentCubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var objHardness = globalData.arrHardnessDRSCPharmatron.find(ht => ht.idsNo == IdsNo);
            var productlimits = globalData.arr_limits.find(al => al.idsNo == IdsNo);
            let now = new Date();
            var pattern = /[^\x20-\x7E]/g;

            var side = "NA";
            if (productObj.Sys_RotaryType == "Single") {
                side = "NA";
            }
            else {
                side = productlimits.Hardness.side == "L" ? "LHS" : "RHS";
            }
            //if (protocolValue != protocolIncomingType + "D000" && protocolValue != "HD000" && protocolValue != "ED000") {
            if (protocolValue != protocolIncomingType + "D000") {
                /**
                * @description We are here setting TD000 and HD000 to false
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }
                /************************************************************* */
                if (protocol.includes('Hardness') == true) {
                    objHardness.oc = objHardness.oc + 1;
                }
                if (objHardness.oc == 1) {
                    // console.log('IN');
                    if (protocol.includes('Meas. Values') == true) {
                        objHardness.hardnessFlag = true;
                        objHardness.masterEntryFlag = true;
                        await objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', 'Hardness', 'started');
                    }
                    if (protocol.includes('Statistics') == true) {
                        objHardness.hardnessFlag = false;
                        //EOS
                    }
                    if (objHardness.hardnessFlag == true) {
                        if (!protocol.includes('Meas. Values')) {

                            //var hardnessVal = protocol.split(':')[1].split(/(?:,| )+/)[1].trim() 
                            var hardnessVal = protocol.split(':')[1].substring(0, protocol.split(':')[1].length - 2).trim()


                            //  var temhardnessVal = hardnessVal.substring(0, hardnessVal.length - 2)
                            // if (pattern.test(temhardnessVal)) { //for non printable chrecter
                            //     var msg = "INVALID STRING,,,,"
                            //     //var msg = "INVALID DATA,RECEIVED,RETRANSMIT DATA,,"
                            //     objHardness.oc = 0
                            //     return `${protocolIncomingType}R40${msg}`;
                            // } Remove by Pradip 24/08/2020 Due to invalid for all sample

                            if (!isNaN(hardnessVal)) {

                                if (objHardness.masterEntryFlag == true && objHardness.capacityFlag == false) {
                                    // var decimalPoint = await calculateDp.precision(objHardness.arr[0]);
                                    //var decimalPoint = await calculateDp.precision(hardnessVal);
                                    var mstSerNo = 0
                                    var sideNo = 0
                                    var mstTableName = 'tbl_tab_master7_incomplete'
                                    var DetTableName = 'tbl_tab_detail7_incomplete'
                                    if (productObj.Sys_RptType == 1) {//for Initial 
                                        mstSerNo = 1
                                        sideNo = 1
                                    }
                                    else { //regular
                                        if (side == 'NA') {
                                            mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                            sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                            if (sideNo < 10) {
                                                sideNo = sideNo + 1;
                                            }
                                            else {
                                                sideNo = 1;
                                                mstSerNo = mstSerNo + 1;
                                            }
                                        }
                                        else {
                                            mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                            sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                            if (sideNo < 5) {
                                                sideNo = sideNo + 1;
                                            }
                                            else {
                                                sideNo = 1;
                                                mstSerNo = mstSerNo + 1;
                                            }
                                        }

                                    }
                                    var res = await proObj.productData(productObj)
                                    var objArrLimits = globalData.arrIdsInfo.find(k => k.idsNo == IdsNo);
                                    const insertIncompleteObj = {
                                        str_tableName: 'tbl_tab_master7_incomplete',
                                        data: [
                                            { str_colName: 'MstSerNo', value: mstSerNo },
                                            { str_colName: 'SideNo', value: sideNo },
                                            { str_colName: 'InstruId', value: 3 },
                                            { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                            { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                            { str_colName: 'ProductType', value: objProductType.productType },
                                            { str_colName: 'Qty', value: productlimits.Hardness.noOfSamples },
                                            { str_colName: 'GrpQty', value: 0 },
                                            { str_colName: 'GrpFreq', value: 0 },
                                            { str_colName: 'Idsno', value: IdsNo },
                                            { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                            { str_colName: 'BalanceId', value: currentCubicalObj.Sys_BalID },
                                            //{ str_colName: 'BalanceNo', value: productObj.Sys_BalID },
                                            { str_colName: 'VernierId', value: currentCubicalObj.Sys_VernierID },
                                            //{ str_colName: 'VernierNo', value: productObj.Sys_BalID },
                                            { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                            { str_colName: 'UserId', value: tempUserObject.UserId },
                                            { str_colName: 'UserName', value: tempUserObject.UserName },
                                            { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                                            { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                                            { str_colName: 'Side', value: side },
                                            { str_colName: 'Unit', value: res[1]['Param7_Unit'] },
                                            { str_colName: 'DecimalPoint', value: res[1]['Param7_Dp'] },
                                            { str_colName: 'WgmtModeNo', value: 7 },
                                            { str_colName: 'Nom', value: res[1]['Param7_Nom'] },
                                            { str_colName: 'T1NegTol', value: res[1]['Param7_T1Neg'] },
                                            { str_colName: 'T1PosTol', value: res[1]['Param7_T1Pos'] },
                                            // { str_colName: 'T2NegTol', value: res[1][paramT2Neg] },
                                            // { str_colName: 'T2PosTol', value: res[1][paramT2Pos] },
                                            { str_colName: 'limitOn', value: res[1]['Param7_LimitOn'].readUIntLE() },
                                            // { str_colName: 'T1NMTTab', value: 0 },
                                            // { str_colName: 'T1NegEmpty', value:  },
                                            // { str_colName: 'T1PosEmpty', value:  },
                                            // { str_colName: 'T2NegEmpty', value:  },
                                            // { str_colName: 'T2PosEmpty', value:  },
                                            // { str_colName: 'NomNet', value:  },
                                            // { str_colName: 'T1NegNet', value:  },
                                            // { str_colName: 'T1PosNet', value:  },
                                            // { str_colName: 'T2NegNet', value:  },
                                            // { str_colName: 'T2PosNet', value:  },
                                            { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                            { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                            { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                            { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                            { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                            { str_colName: 'FriabilityID', value: currentCubicalObj.Sys_FriabID },
                                            { str_colName: 'HardnessID', value: currentCubicalObj.Sys_HardID },
                                            { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                            { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                            { str_colName: 'RepoLabel10', value: res[0].NominalNomenclature },
                                            { str_colName: 'RepoLabel11', value: productObj.Sys_Validation }, // this will store wether the test is validation or not 
                                            // { str_colName: 'RepoLabel12', value:  },
                                            { str_colName: 'RepoLabel14', value: productObj.Sys_IPQCType },
                                            { str_colName: 'PrintNo', value: 0 },
                                            { str_colName: 'IsArchived', value: 0 },
                                            { str_colName: 'GraphType', value: res[1]['Param7_IsOnStd'].readUIntLE() },
                                            { str_colName: 'BatchComplete', value: 0 },
                                            { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                            { str_colName: 'Version', value: productObj.Sys_Version },
                                            { str_colName: 'Lot', value: objLotData.LotNo },
                                            { str_colName: 'Area', value: productObj.Sys_Area },
                                            { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                            { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                            { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                            { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                            { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                                        ]

                                    }
                                    console.log(insertIncompleteObj)
                                    var masterRes = await database.save(insertIncompleteObj);
                                    let objActivity = {};
                                    Object.assign(objActivity,
                                        { strUserId: tempUserObject.UserId },
                                        { strUserName: tempUserObject.UserName },
                                        { activity: 'Hardness Weighment Started on IDS' + IdsNo });
                                    await objActivityLog.ActivityLogEntry(objActivity);
                                    objHardness.masterEntryFlag = false;
                                    var lastInsertedID = masterRes[0].insertId;
                                    var hardnessVal = protocol.split(':')[1].substring(0, protocol.split(':')[1].length - 2).trim()
                                    if (hardnessVal != "") {
                                        objHardness.arr.push(hardnessVal);
                                        console.log('Array', objHardness.arr)
                                        var decimalPoint = await calculateDp.precision(hardnessVal);
                                        var detailObj = {
                                            str_tableName: 'tbl_tab_detail7_incomplete',
                                            data: [
                                                { str_colName: 'RepSerNo', value: lastInsertedID },
                                                { str_colName: 'MstSerNo', value: 0 },
                                                { str_colName: 'RecSeqNo', value: 1 },
                                                { str_colName: 'DataValue', value: hardnessVal },
                                                { str_colName: 'DecimalPoint', value: decimalPoint }
                                            ]
                                        }

                                        await database.save(detailObj)


                                        var strupdateDEcimalInMst = `Update tbl_tab_master7_incomplete set DecimalPoint='${decimalPoint}' where RepSerNo='${lastInsertedID}'`
                                        console.log(strupdateDEcimalInMst)
                                        var result = await database.execute(strupdateDEcimalInMst)
                                    }
                                    objHardness.masterId = lastInsertedID;

                                } else {
                                    var hardnessVal = protocol.split(':')[1].substring(0, protocol.split(':')[1].length - 2).trim()

                                    if (hardnessVal != "") {
                                        objHardness.arr.push(hardnessVal);
                                        console.log('Array', objHardness.arr)
                                        var decimalPoint = await calculateDp.precision(hardnessVal);
                                        console.log(productlimits.Hardness.noOfSamples, objHardness.arr.length);
                                        if (productlimits.Hardness.noOfSamples >= objHardness.arr.length) {
                                            var detailObj = {
                                                str_tableName: 'tbl_tab_detail7_incomplete',
                                                data: [
                                                    { str_colName: 'RepSerNo', value: objHardness.masterId },
                                                    { str_colName: 'MstSerNo', value: 0 },
                                                    { str_colName: 'RecSeqNo', value: objHardness.arr.length },
                                                    { str_colName: 'DataValue', value: hardnessVal },
                                                    { str_colName: 'DecimalPoint', value: decimalPoint }
                                                ]
                                            }

                                            await database.save(detailObj)


                                        }
                                    }
                                }
                            }

                        }
                    }
                }

                return protocolValue;
            } else {
                /**
                * @description We are here setting TD000 and HD000 to true
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                console.log(tempTDHD)
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    if (productlimits.Hardness.noOfSamples > objHardness.arr.length) {
                        var remSample = parseInt(productlimits.Hardness.noOfSamples) - objHardness.arr.length;
                        var HRDProtocol = `${protocolIncomingType}R0` + remSample + " Samples Pending,,,,,";
                        objHardness.capacityFlag = true;
                        objHardness.hardnessFlag = false;
                        objHardness.oc = 0
                        return HRDProtocol;
                    } else {
                        var remarkRes = await hardnessData.saveHardnessData8M(objHardness.masterId, IdsNo);
                        let objActivity = {};
                        await objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', '', 'completed');
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Hardness Weighment Completed on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        var appendProtocol = 'R1';
                        if (remarkRes == 'Complies') {
                            appendProtocol = 'R1';
                        } else {
                            appendProtocol = 'R2';
                        }
                        return `${protocolIncomingType}${appendProtocol},,,,,`;
                    }
                } else {
                    console.log('REPEAT_COUNT FOR TDHD000');
                    return '+'
                }
            }
        } catch (err) {
            var tempHardnessReadings = globalData.arrHardnessDRSCPharmatron.find(k => k.idsNo == IdsNo)
            if (tempHardnessReadings == undefined) {
                globalData.arrHardnessDRSCPharmatron.push({ idsNo: IdsNo, oc: 0, hardnessFlag: false, arr: [], capacityFlag: false, masterId: 0, masterEntryFlag: false });
            } else {
                tempHardnessReadings.oc = 0;
                tempHardnessReadings.arr = [];
                tempHardnessReadings.capacityFlag = false;
                tempHardnessReadings.hardnessFlag = false;
                tempHardnessReadings.masterId = 0;
                tempHardnessReadings.masterEntryFlag = false;
            }
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log("error from Hardness in Bulkweighment", err)
            throw new Error(err);
        }
    }
    async insertHardnessKraemer(IdsNo, protocol) {
        try {
            var insertedToPowerBackup = globalData.arrHardnessPowerbackupFlag.find(k => k.idsNo == IdsNo);
            if (insertedToPowerBackup == undefined) {
                globalData.arrHardnessPowerbackupFlag.push({ idsNo: IdsNo, IsinsertedToPowerBackup: false });
            }
            else {
                insertedToPowerBackup.IsinsertedToPowerBackup = insertedToPowerBackup.IsinsertedToPowerBackup;
            }
            var mstSerNo = ''
            var sideNo = ''
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var protocolValue = protocol.substring(0, 5);// starting 5 character

            var protocolValueData = protocol.substring(5);
            protocolValueData = protocolValueData.substring(protocolValueData, protocolValueData.length - 2);// starting 5 character

            var protocolIncomingType = protocolValue.substring(0, 1);//here incoming protocol is check T Or H
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var currentCubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var objHardness = globalData.arrHardnessKramer.find(ht => ht.idsNo == IdsNo);
            var productlimits = globalData.arr_limits.find(al => al.idsNo == IdsNo);
            let now = new Date();
            var pattern = /[^\x20-\x7E]/g;

            var side = "NA";
            if (productObj.Sys_RotaryType == "Single") {
                side = "NA";
            }
            else {
                side = productlimits.Hardness.side == "L" ? "LHS" : "RHS";
            }

            var hardnessVal = ''

            if (protocolValue != protocolIncomingType + "D000") {
                /**
                * @description We are here setting TD000 and HD000 to false
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }
                /************************************************************* */
                if (protocolValueData != '' && protocolValueData.includes('#') == true) {
                    var msg = "";
                    msg = "Invalid String,,,,";
                    //msg = "INVALID DATA,RECEIVED,RETRANSMIT DATA,,"

                    hardnessVal = protocolValueData.split(" ");
                    //var IsinsertedToPowerBackup = globalData.arrHardnessPowerbackupFlag.find(k => k.idsNo == IdsNo);

                    // if (protocolValue == protocolIncomingType + "D002" && !IsinsertedToPowerBackup.IsinsertedToPowerBackup) {
                    //     //if (protocolValue == protocolIncomingType + "D002") {
                    //     //await clspowerbackup.insertPowerBackupData(currentCubicalObj, "H", tempUserObject, IdsNo, '7', 'Kraemer');

                    //     IsinsertedToPowerBackup.IsinsertedToPowerBackup = true;
                    // }

                    var tempprotocolValueData = protocolValueData.substring(0, protocolValueData.length - 2).trim();//for non-printable chrecters test

                    if (protocolValueData.includes('HA=') == false || pattern.test(tempprotocolValueData) == true || isNaN(parseFloat(hardnessVal[3].substring(3))) == true) {
                        objHardness.sampleNo = objHardness.sampleNo - 1;
                        return `${protocolIncomingType}R40${msg}`;
                    }
                    hardnessVal = parseFloat(hardnessVal[3].substring(3));

                    var mstTableName = 'tbl_tab_master7_incomplete'
                    var DetTableName = 'tbl_tab_detail7_incomplete'

                    if (objHardness.sampleNo == 0) {// storing master  and detail record on first sample 
                        var res = await proObj.productData(productObj)
                        var objArrLimits = globalData.arrIdsInfo.find(k => k.idsNo == IdsNo);
                        // value: productObj.Sys_PVersion },
                        // { str_colName: 'Version', value: productObj.Sys_Version },
                        if (productObj.Sys_RptType == 1) {//for Initial 
                            mstSerNo = 1
                            sideNo = 1
                        }
                        else { //regular
                            if (side == 'NA') {
                                mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                if (sideNo < 10) {
                                    sideNo = sideNo + 1;
                                }
                                else {
                                    sideNo = 1;
                                    mstSerNo = mstSerNo + 1;
                                }
                            }
                            else {
                                mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                if (sideNo < 5) {
                                    sideNo = sideNo + 1;
                                }
                                else {
                                    sideNo = 1;
                                    mstSerNo = mstSerNo + 1;
                                }
                            }

                        }

                        await clspowerbackup.insertPowerBackupData(currentCubicalObj, protocolIncomingType, tempUserObject, IdsNo, '7', 'Kraemer', "Hardness");
                        const insertIncompleteObj = {
                            str_tableName: mstTableName,
                            data: [
                                { str_colName: 'MstSerNo', value: mstSerNo },
                                { str_colName: 'SideNo', value: sideNo },
                                { str_colName: 'InstruId', value: 3 },
                                { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                { str_colName: 'ProductType', value: objProductType.productType },
                                { str_colName: 'Qty', value: productlimits.Hardness.noOfSamples },
                                { str_colName: 'GrpQty', value: 0 },
                                { str_colName: 'GrpFreq', value: 0 },
                                { str_colName: 'Idsno', value: IdsNo },
                                { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                { str_colName: 'BalanceId', value: currentCubicalObj.Sys_BalID },
                                //{ str_colName: 'BalanceNo', value: productObj.Sys_BalID },
                                { str_colName: 'VernierId', value: currentCubicalObj.Sys_VernierID },
                                //{ str_colName: 'VernierNo', value: productObj.Sys_BalID },
                                { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                { str_colName: 'UserId', value: tempUserObject.UserId },
                                { str_colName: 'UserName', value: tempUserObject.UserName },
                                { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                                { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                                { str_colName: 'Side', value: side },
                                { str_colName: 'Unit', value: res[1]['Param7_Unit'] },
                                { str_colName: 'DecimalPoint', value: res[1]['Param7_Dp'] },
                                { str_colName: 'WgmtModeNo', value: 7 },
                                { str_colName: 'Nom', value: res[1]['Param7_Nom'] },
                                { str_colName: 'T1NegTol', value: res[1]['Param7_T1Neg'] },
                                { str_colName: 'T1PosTol', value: res[1]['Param7_T1Pos'] },
                                // { str_colName: 'T2NegTol', value: res[1][paramT2Neg] },
                                // { str_colName: 'T2PosTol', value: res[1][paramT2Pos] },
                                { str_colName: 'limitOn', value: res[1]['Param7_LimitOn'].readUIntLE() },
                                // { str_colName: 'T1NMTTab', value: 0 },
                                // { str_colName: 'T1NegEmpty', value:  },
                                // { str_colName: 'T1PosEmpty', value:  },
                                // { str_colName: 'T2NegEmpty', value:  },
                                // { str_colName: 'T2PosEmpty', value:  },
                                // { str_colName: 'NomNet', value:  },
                                // { str_colName: 'T1NegNet', value:  },
                                // { str_colName: 'T1PosNet', value:  },
                                // { str_colName: 'T2NegNet', value:  },
                                // { str_colName: 'T2PosNet', value:  },
                                { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                { str_colName: 'FriabilityID', value: currentCubicalObj.Sys_FriabID },
                                { str_colName: 'HardnessID', value: currentCubicalObj.Sys_HardID },
                                { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                { str_colName: 'RepoLabel10', value: res[0].NominalNomenclature },
                                { str_colName: 'RepoLabel11', value: productObj.Sys_Validation }, // this will store wether the test is validation or not 
                                { str_colName: 'RepoLabel14', value: productObj.Sys_IPQCType },
                                { str_colName: 'PrintNo', value: 0 },
                                { str_colName: 'IsArchived', value: 0 },
                                { str_colName: 'GraphType', value: res[1]['Param7_IsOnStd'].readUIntLE() },
                                { str_colName: 'BatchComplete', value: 0 },
                                { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                { str_colName: 'Version', value: productObj.Sys_Version },
                                { str_colName: 'Lot', value: objLotData.LotNo },
                                { str_colName: 'Area', value: productObj.Sys_Area },
                                { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                            ]

                        }
                        console.log(insertIncompleteObj)
                        var masterRes = await database.save(insertIncompleteObj);

                        const getRepsrNo = {
                            str_tableName: 'tbl_tab_master7_incomplete',
                            data: 'MAX(RepSerNo) AS RepSerNo',
                            condition: [
                                { str_colName: 'BFGCode', value: productObj.Sys_BFGCode, comp: 'eq' },
                                { str_colName: 'ProductName', value: productObj.Sys_ProductName, comp: 'eq' },
                                { str_colName: 'PVersion', value: productObj.Sys_PVersion, comp: 'eq' },
                                { str_colName: 'Version', value: productObj.Sys_Version, comp: 'eq' },
                                { str_colName: 'BatchNo', value: productObj.Sys_Batch, comp: 'eq' },
                                { str_colName: 'Idsno', value: IdsNo, comp: 'eq' },
                            ]
                        }

                        // console.log("tbl_tab_masterhtd_incomplete  1 :" + checkMasterData);
                        var res = await database.select(getRepsrNo);
                        let objUpdatepowerbackup = {
                            str_tableName: 'tbl_powerbackup',
                            data: [
                                { str_colName: 'Incomp_RepSerNo', value: res[0][0].RepSerNo }
                            ],
                            condition: [
                                { str_colName: 'Idsno', value: IdsNo },
                                { str_colName: 'Sys_BFGCode', value: productObj.Sys_BFGCode },
                                { str_colName: 'Sys_Batch', value: productObj.Sys_Batch }

                            ]
                        }
                        await database.update(objUpdatepowerbackup);

                        objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', 'Hardness', 'started')
                        let objActivity = {};
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Hardness Weighment Started on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        objHardness.masterEntryFlag = false;
                        var lastInsertedID = masterRes[0].insertId;

                        if (hardnessVal != "") {
                            objHardness.arr.push(hardnessVal);
                            console.log('Array', objHardness.arr)
                            var decimalPoint = await calculateDp.precision(hardnessVal);
                            var detailObj = {
                                str_tableName: 'tbl_tab_detail7_incomplete',
                                data: [
                                    { str_colName: 'RepSerNo', value: lastInsertedID },
                                    { str_colName: 'MstSerNo', value: mstSerNo },
                                    { str_colName: 'RecSeqNo', value: 1 },
                                    { str_colName: 'DataValue', value: hardnessVal },
                                    { str_colName: 'DecimalPoint', value: decimalPoint }
                                ]
                            }
                            var detailRes = await database.save(detailObj);
                        }
                        objHardness.masterId = lastInsertedID;
                        objHardness.sampleNo = 1
                    }
                    else {
                        objHardness.sampleNo = objHardness.sampleNo + 1
                        if (hardnessVal != "") {
                            objHardness.arr.push(hardnessVal);
                            // console.log('Array', objHardness.arr)
                            var decimalPoint = await calculateDp.precision(hardnessVal);
                            // console.log(productlimits.Hardness.noOfSamples, objHardness.arr.length);

                            let obHardness = globalData.arrHardnessKramer.find(ht => ht.idsNo == IdsNo);
                            let fetchMstSerNo = {
                                str_tableName: 'tbl_tab_master7_incomplete',
                                data: 'MstSerNo',
                                condition: [
                                    { str_colName: 'RepSerNo', value: obHardness.masterId, comp: 'eq' },
                                ]
                            }
                            var objfetchMstSerNo = await database.select(fetchMstSerNo);

                            if (productlimits.Hardness.noOfSamples >= objHardness.arr.length) {
                                var detailObj = {
                                    str_tableName: DetTableName,
                                    data: [
                                        { str_colName: 'RepSerNo', value: objHardness.masterId },
                                        { str_colName: 'MstSerNo', value: objfetchMstSerNo[0][0].MstSerNo },
                                        { str_colName: 'RecSeqNo', value: objHardness.arr.length },
                                        { str_colName: 'DataValue', value: hardnessVal },
                                        { str_colName: 'DecimalPoint', value: decimalPoint }
                                    ]
                                }
                                var detailRes = await database.save(detailObj);
                            }
                        }
                    }
                }

                return protocolValue;

            } else {
                /**
                 * @description We are here setting TD000 and HD000 to true
                 */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                console.log(tempTDHD)
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    if (objHardness.arr.length < productlimits.Hardness.noOfSamples) {
                        var remSample = objHardness.arr.length;
                        var HRDProtocol = `${protocolIncomingType}R0` + remSample + " Samples Recived,,,,,";
                        objMonitor.monit({ case: 'HDT', idsNo: IdsNo, data: { sample: objHardness.sampleNo, flag: 'start' } });
                        objHardness.capacityFlag = true;
                        objHardness.hardnessFlag = false;
                        objHardness.oc = 0
                        return HRDProtocol;
                    } else {
                        var remarkRes = await hardnessData.saveHardnessDataKraemer(objHardness.masterId, IdsNo);
                        let objActivity = {};
                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'HARDNESS', flag: 'COMPLETED' } });
                        await objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', '', 'completed');
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Hardness Weighment Completed on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        var appendProtocol = 'R1';
                        if (remarkRes == 'Complies') {
                            appendProtocol = 'R1';
                        } else {
                            appendProtocol = 'R2';
                        }
                        return `${protocolIncomingType}${appendProtocol},,,,,`;
                    }
                } else {
                    console.log('REPEAT_COUNT FOR TDHD000');
                    return '+';
                }
            }
        } catch (err) {// error handeling
            var tempHardnessReadings = globalData.arrHardnessKramer.find(k => k.idsNo == IdsNo)
            if (tempHardnessReadings == undefined) {
                const obj = {
                    idsNo: IdsNo,
                    sampleNo: 0,
                    masterEntryFlag: false,
                    hardnessVal: 0,
                    opNominal: NomValue,
                    opNegTol: lowerLimit,
                    opPosTol: upperLimit,
                    arr: []
                };
                globalData.arrHardnessKramer.push(obj);
            } else {
                tempHardnessReadings.sampleNo = 0,
                    tempHardnessReadings.masterEntryFlag = false,
                    tempHardnessReadings.hardnessVal = 0,
                    tempHardnessReadings.opNominal = 0,
                    tempHardnessReadings.opNegTol = 0,
                    tempHardnessReadings.arr = [],
                    tempHardnessReadings.opPosTol = 0
            }
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log("error from Hardness in Bulkweighment", err)
            throw new Error(err);
        }
    }
    /**
     * @description Hardsness Pharmatron MT50 function
     * @date 10/09/2020
     */
    async insertPharmatronMT50(IdsNo, protocol) {
        try {
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo);
            var mstSerNo = '';
            var sideNo = '';
            var strSampleNoFromString = '';
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var currentCubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            var actualProtocol = protocol;
            var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var protocolValue = protocol.substring(0, 5);// starting 5 character
            var protocolValueData = protocol.substring(5, protocol.length - 2);// starting 5 character
            var protocolIncomingType = protocolValue.substring(0, 1);//Check incoming Protocol is from "T" or "H"
            var productlimits = globalData.arr_limits.find(al => al.idsNo == IdsNo);
            var objHardness = globalData.arrHardnessMT50.find(ht => ht.idsNo == IdsNo);
            var objarrHardnessMT50Reading = globalData.arrHardnessMT50Reading.find(ht => ht.idsNo == IdsNo);

            let now = new Date();
            var pattern = /[^\x20-\x7E]/g;
            var side = "NA";
            if (productObj.Sys_RotaryType == "Single") {
                side = "NA";
            }
            else {
                side = productlimits.Hardness.side == "L" ? "LHS" : "RHS";
            }

            if (protocolValue == protocolIncomingType + "D001") {//hardness reading started
                objarrHardnessMT50Reading.Readingflag = true
                return protocolValue
            }

            if (protocolValue == protocolIncomingType + "D000") {

                if ((objarrHardnessMT50Reading.sampleFromString >= productlimits.Hardness.noOfSamples &&
                    objarrHardnessMT50Reading.SampleSkipped == false) &&
                    ((objarrHardnessMT50Reading.sampleFromString - (parseFloat(objarrHardnessMT50Reading.localSampleCounter) + 1)) <= 0)) {

                    //check total number data present in table
                    var objchkchkLastInsrtedDataMT50 = await hardnessData.chkHardnessDataCount(side, IdsNo)

                    if (objchkchkLastInsrtedDataMT50 < productlimits.Hardness.noOfSamples && objchkchkLastInsrtedDataMT50 != 0 &&
                        objchkchkLastInsrtedDataMT50 != undefined && objchkchkLastInsrtedDataMT50 != 'NULL') {
                        let objclearHardnesVariable = this.clearHardnesVariable(IdsNo)
                        let result = 'HR41Incomplete Report,Generated,,,'
                        return result
                    }
                    else {
                        var remarkRes = await hardnessData.saveHardnessDataMT50(objHardness.masterId, IdsNo);
                        let objclearHardnesVariable = this.clearHardnesVariable(IdsNo)

                        let objActivity = {};
                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'HARDNESS', flag: 'COMPLETED' } });
                        await objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', '', 'completed');
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Hardness Weighment Completed on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        var appendProtocol = 'R1';
                        if (remarkRes == 'Complies') {
                            appendProtocol = 'R1';
                        } else {
                            appendProtocol = 'R2';
                        }
                        return `${protocolIncomingType}${appendProtocol},,,,,`;

                    }
                }


                if (((objarrHardnessMT50Reading.sampleFromString - (parseFloat(objarrHardnessMT50Reading.localSampleCounter) + 1)) > 0) ||
                    objarrHardnessMT50Reading.SampleSkipped == true) {
                    if (objarrHardnessMT50Reading.RhCounter != 2) {
                        objarrHardnessMT50Reading.RhCounter = objarrHardnessMT50Reading.RhCounter + 1
                        console.log('sending RH = ' + objarrHardnessMT50Reading.RhCounter)
                        let result = protocolIncomingType.includes('T') ? 'RT' : 'RH'//sending "RH" for repeat protocol
                        return result;
                    }
                    else if (objarrHardnessMT50Reading.RhCounter == 2) {
                        //this if block will check if sample received from string directly as '2' and 
                        //if sample from hardness is greater than qty set in cubicle than generate incomplete report
                        objarrHardnessMT50Reading.localSampleCounter = objarrHardnessMT50Reading.sampleFromString
                        if ((objarrHardnessMT50Reading.sampleFromString == 2 && objarrHardnessMT50Reading.localSampleCounter == 0) ||
                            (objarrHardnessMT50Reading.sampleFromString >= productlimits.Hardness.noOfSamples)) {
                            let objClearHardnessVariable = await this.clearHardnesVariable(IdsNo)
                            let result = 'HR41Incomplete Report,Generated,,,'
                            return result;
                        }
                        else {
                            objarrHardnessMT50Reading.Readingflag = false,
                                objarrHardnessMT50Reading.RhCounter = 0,
                                objarrHardnessMT50Reading.SampleSkipped = false,
                                objarrHardnessMT50Reading.atPresent = false
                            let result = `${protocolIncomingType}R0 ${objarrHardnessMT50Reading.sampleFromString} Samples Recived.,,,,,`
                            return result;
                        }
                    }
                }
                else {
                    //replace locla counter with actual sample value because there 
                    //we didnt get missed sample after 2 attempts
                    objarrHardnessMT50Reading.SampleSkipped = false
                    objHardness.sampleNo = objarrHardnessMT50Reading.localSampleCounter
                    console.log('local counter =' + objarrHardnessMT50Reading.localSampleCounter)
                    var HRDProtocol = `${protocolIncomingType}R0` + objHardness.sampleNo + " Samples Recived,,,,,";
                    objMonitor.monit({ case: 'HDT', idsNo: IdsNo, data: { sample: objHardness.sampleNo, flag: 'start' } });
                    objHardness.capacityFlag = true;
                    objHardness.hardnessFlag = false;
                    objHardness.oc = 0
                    return HRDProtocol;
                }
            }

            // if (objHardness.sampleNo < productlimits.Hardness.noOfSamples) {
            //     var HRDProtocol = `${protocolIncomingType}R0` + objHardness.sampleNo + " Samples Recived,,,,,";
            //     objMonitor.monit({ case: 'HDT', idsNo: IdsNo, data: { sample: objHardness.sampleNo, flag: 'start' } });
            //     objHardness.capacityFlag = true;
            //     objHardness.hardnessFlag = false;
            //     objHardness.oc = 0
            //     return HRDProtocol;
            // } else {

            //     var remarkRes = await hardnessData.saveHardnessDataMT50(objHardness.masterId, IdsNo);
            //     let objActivity = {};
            //     objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'HARDNESS', flag: 'COMPLETED' } });
            //     await objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', '', 'completed');
            //     Object.assign(objActivity,
            //         { strUserId: tempUserObject.UserId },
            //         { strUserName: tempUserObject.UserName },
            //         { activity: 'Hardness Weighment Completed on IDS' + IdsNo });
            //     await objActivityLog.ActivityLogEntry(objActivity);
            //     var appendProtocol = 'R1';
            //     if (remarkRes == 'Complies') {
            //         appendProtocol = 'R1';
            //     } else {
            //         appendProtocol = 'R2';
            //     }
            //     return `${protocolIncomingType}${appendProtocol},,,,,`;
            // }


            if (objarrHardnessMT50Reading.Readingflag = true) {
                if (protocolValueData.includes("@") && !protocolValueData.includes("@0")) {
                    objarrHardnessMT50Reading.atPresent = true  // set true if @ present
                    var thicknessVal = 0, widthVal = 0, diameterVal = 0, hardnessVal = 0;
                    // main logic to extract value from given line 
                    var str = protocolValueData
                    var strInvalidmsg = 'Invalid String'

                    strSampleNoFromString = str.substring(1, str.indexOf(' '))//to get sample number from string
                    if (isNaN(strSampleNoFromString) == true) {
                        console.log('invalid string =sample Not found')
                        return `${protocolIncomingType}R40${strInvalidmsg},,,,`;
                    }
                    else {
                        objarrHardnessMT50Reading.sampleFromString = strSampleNoFromString// saving sample no from hardness
                    }

                    //reseting the all varible which is used to save data for hardness*******/
                    if (strSampleNoFromString == 1 && objarrHardnessMT50Reading.RhCounter == 0) {
                        objHardness.HardnessVal = [],
                            objHardness.HardnessDecimal = 0,
                            objHardness.HardnessNom = 0,
                            objHardness.Hardnessrneg = 0,
                            objHardness.Hardnesspos = 0
                    }
                    //********************************************************************** */

                    if ((strSampleNoFromString - (parseFloat(objarrHardnessMT50Reading.localSampleCounter) + 1)) > 0) {
                        objarrHardnessMT50Reading.SampleSkipped = true
                    } else {
                        objarrHardnessMT50Reading.localSampleCounter++; //increment Local Counter by one
                        console.log('local counter while get data =' + objarrHardnessMT50Reading.localSampleCounter)
                        objarrHardnessMT50Reading.SampleSkipped = false
                    }

                    // // for Thickness *************************************************************************
                    // if (str.includes("T") && productlimits.Thickness != undefined) {
                    //     thicknessVal = str.substring(str.indexOf("T") + 1, str.indexOf("mm")).trim()
                    //     if (isNaN(thicknessVal) == false) {// if the received value is valid value
                    //         objHardness.thicknessVal = thicknessVal
                    //         objHardness.thicknessDecimal = 2;
                    //         objHardness.sampleNo = strSampleNoFromString
                    //     }
                    //     else {
                    //         objHardness.thicknessVal = '';
                    //         objHardness.thicknessDecimal = 0;
                    //         return `${protocolIncomingType}R40${strInvalidmsg},,,,`;
                    //     }
                    // }
                    // else {
                    //     objHardness.thicknessVal = 0;
                    //     objHardness.thicknessDecimal = 0;
                    //     objHardness.sampleNo = strSampleNoFromString
                    // }
                    // /*********************************************************************************** */

                    // // for Width *************************************************************************
                    // if (str.includes('Wd') && productlimits.Width != undefined) {
                    //     widthVal = str.substring(str.indexOf("Wd") + 1, str.indexOf("mm")).trim()
                    //     if (isNaN(widthVal) == false) {// if the received value is valid value
                    //         objHardness.WidthVal = thicknessVal;
                    //         objHardness.WidthDecimal = 2;
                    //         objHardness.sampleNo = strSampleNoFromString
                    //     }
                    //     else {
                    //         objHardness.WidthVal = '';
                    //         objHardness.WidthDecimal = 0;
                    //         return `${protocolIncomingType}R40${strInvalidmsg},,,,`;
                    //     }
                    // }
                    // else {
                    //     objHardness.WidthVal = 0;
                    //     objHardness.WidthDecimal = 0;
                    //     objHardness.sampleNo = strSampleNoFromString
                    // }
                    // /*********************************************************************************** */

                    // // for Diameter *************************************************************************
                    // if (str.includes('D') && productlimits.Diameter != undefined) {
                    //     diameterVal = str.substring(str.indexOf("D") + 1, str.indexOf("mm")).trim()
                    //     if (isNaN(diameterVal) == false) {// if the received value is valid value
                    //         objHardness.DiameterVal = diameterVal;
                    //         objHardness.DiameterDecimal = 2;
                    //         objHardness.sampleNo = strSampleNoFromString
                    //     }
                    //     else {
                    //         objHardness.DiameterVal = '';
                    //         objHardness.DiameterDecimal = 0;
                    //         return `${protocolIncomingType}R40${strInvalidmsg},,,,`;
                    //     }
                    // }
                    // else {
                    //     objHardness.DiameterVal = 0;
                    //     objHardness.DiameterDecimal = 0;
                    //     objHardness.sampleNo = strSampleNoFromString
                    // }
                    // /*********************************************************************************** */

                    // for Hardness *************************************************************************
                    if (str.includes('H') && productlimits.Hardness != undefined) {
                        if (str.includes("N")) {
                            hardnessVal = str.substring(str.indexOf("H") + 1, str.indexOf("N")).trim()
                        }
                        else {
                            hardnessVal = str.substring(str.indexOf("H") + 1, str.indexOf("Kp")).trim()
                        }

                        if (isNaN(hardnessVal) == false) {// if the received value is valid value
                            objHardness.HardnessVal.push(hardnessVal);
                            objHardness.HardnessDecimal = 2;
                            objHardness.sampleNo = strSampleNoFromString
                        }
                        else {
                            objarrHardnessMT50Reading.localSampleCounter--;
                            console.log('invalid string = Hardness sample invalid')
                            objHardness.HardnessDecimal = 0;
                            return `${protocolIncomingType}R40${strInvalidmsg},,,,`;
                        }
                    }
                    else {
                        //objHardness.HardnessVal = 0;
                        objHardness.HardnessDecimal = 0;
                        objHardness.sampleNo = strSampleNoFromString
                    }
                    /*********************************************************************************** */

                    //this will check if sample is came directly as 2 OR 
                    //sample came directly as eual to QTY
                    if ((strSampleNoFromString >= productlimits.Hardness.noOfSamples && objarrHardnessMT50Reading.localSampleCounter == 0)
                        || ((parseFloat(strSampleNoFromString) != 1) && objarrHardnessMT50Reading.localSampleCounter == 0)) {
                        let objclearHardnesVariable = this.clearHardnesVariable(IdsNo)
                        console.log('invalid string = this will check if sample is came directly as 2 OR sample came directly as eual to QTY')
                        return `${protocolIncomingType}R40${strInvalidmsg},,,,`;
                    }

                    // storing master  and detail record on first sample 
                    if (strSampleNoFromString == 1 && objarrHardnessMT50Reading.localSampleCounter == 1) {
                        let objActivity = {};
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Hardness Weighment Started on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);

                        var mstTableName = 'tbl_tab_master7_incomplete'
                        var DetTableName = 'tbl_tab_detail7_incomplete'

                        var res = await proObj.productData(productObj)
                        var objArrLimits = globalData.arrIdsInfo.find(k => k.idsNo == IdsNo);
                        if (productObj.Sys_RptType == 1) {//for Initial 
                            mstSerNo = 1
                            sideNo = 1
                        }
                        else { //regular
                            if (side == 'NA') {
                                mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                if (sideNo < 10) {
                                    sideNo = sideNo + 1;
                                }
                                else {
                                    sideNo = 1;
                                    mstSerNo = mstSerNo + 1;
                                }
                            }
                            else {
                                mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                if (sideNo < 5) {
                                    sideNo = sideNo + 1;
                                }
                                else {
                                    sideNo = 1;
                                    mstSerNo = mstSerNo + 1;
                                }
                            }
                        }
                        const insertIncompleteObj = {
                            str_tableName: mstTableName,
                            data: [
                                { str_colName: 'MstSerNo', value: mstSerNo },
                                { str_colName: 'SideNo', value: sideNo },
                                { str_colName: 'InstruId', value: 3 },
                                { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                { str_colName: 'ProductType', value: objProductType.productType },
                                { str_colName: 'Qty', value: productlimits.Hardness.noOfSamples },
                                { str_colName: 'GrpQty', value: 0 },
                                { str_colName: 'GrpFreq', value: 0 },
                                { str_colName: 'Idsno', value: IdsNo },
                                { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                { str_colName: 'BalanceId', value: currentCubicalObj.Sys_BalID },
                                //{ str_colName: 'BalanceNo', value: productObj.Sys_BalID },
                                { str_colName: 'VernierId', value: currentCubicalObj.Sys_VernierID },
                                //{ str_colName: 'VernierNo', value: productObj.Sys_BalID },
                                { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                { str_colName: 'UserId', value: tempUserObject.UserId },
                                { str_colName: 'UserName', value: tempUserObject.UserName },
                                { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                                { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                                { str_colName: 'Side', value: side },
                                { str_colName: 'Unit', value: res[1]['Param7_Unit'] },
                                { str_colName: 'DecimalPoint', value: res[1]['Param7_Dp'] },
                                { str_colName: 'WgmtModeNo', value: 7 },
                                { str_colName: 'Nom', value: res[1]['Param7_Nom'] },
                                { str_colName: 'T1NegTol', value: res[1]['Param7_T1Neg'] },
                                { str_colName: 'T1PosTol', value: res[1]['Param7_T1Pos'] },
                                { str_colName: 'limitOn', value: res[1]['Param7_LimitOn'].readUIntLE() },
                                { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                { str_colName: 'FriabilityID', value: currentCubicalObj.Sys_FriabID },
                                { str_colName: 'HardnessID', value: currentCubicalObj.Sys_HardID },
                                { str_colName: 'CubicleName', value: productObj.Sys_CubicName },
                                { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                { str_colName: 'RepoLabel10', value: res[0].NominalNomenclature },
                                { str_colName: 'RepoLabel11', value: productObj.Sys_Validation }, // this will store wether the test is validation or not 
                                { str_colName: 'RepoLabel14', value: productObj.Sys_IPQCType },
                                { str_colName: 'PrintNo', value: 0 },
                                { str_colName: 'IsArchived', value: 0 },
                                { str_colName: 'GraphType', value: res[1]['Param7_IsOnStd'].readUIntLE() },
                                { str_colName: 'BatchComplete', value: 0 },
                                { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                { str_colName: 'Version', value: productObj.Sys_Version },
                                { str_colName: 'Lot', value: objLotData.LotNo },
                                { str_colName: 'Area', value: productObj.Sys_Area },
                                { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                                //{ str_colName: 'HTMake', value: 'MT50' },
                            ]

                        }
                        console.log(insertIncompleteObj)
                        var masterRes = await database.save(insertIncompleteObj);
                        objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', 'Hardness', 'started')
                        objActivity = {};
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Hardness Weighment Started on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        objHardness.masterEntryFlag = false;
                        var lastInsertedID = masterRes[0].insertId;

                        if (hardnessVal != "") {
                            var decimalPoint = await calculateDp.precision(hardnessVal);
                            var detailObj = {
                                str_tableName: 'tbl_tab_detail7_incomplete',
                                data: [
                                    { str_colName: 'RepSerNo', value: lastInsertedID },
                                    { str_colName: 'MstSerNo', value: mstSerNo },
                                    { str_colName: 'RecSeqNo', value: 1 },
                                    { str_colName: 'DataValue', value: hardnessVal },
                                    { str_colName: 'DecimalPoint', value: decimalPoint }
                                ]
                            }
                            const DetailsEntries = {
                                str_tableName: "tbl_tab_detail7_incomplete",
                                data: 'MAX(RecSeqNo) AS SeqNo',
                                condition: [
                                    { str_colName: 'RepSerNo', value: lastInsertedID, comp: 'eq' }
                                ]
                            }
                            var tabDetails = await database.select(DetailsEntries)
                            if (tabDetails[0][0].SeqNo == null) {
                                var entries = 1
                            } else {
                                var entries = tabDetails[0][0].SeqNo + 1
                            }

                            if (entries == parseInt(objHardness.sampleNo)) {
                                await database.save(detailObj)
                            }

                            if (entries == parseInt(objHardness.sampleNo)) {
                                await database.save(detailObj)
                            }
                            else {
                                //logFromPC.addtoProtocolLog(`sample no ${entries} recieved instead of ${objHardness.sampleNo}`)
                                objHardness.sampleNo = objHardness.sampleNo - 1
                            }
                        }
                        objHardness.masterId = lastInsertedID;
                        return protocolValue;
                    } else {
                        var mstTableName = 'tbl_tab_master7_incomplete'
                        var DetTableName = 'tbl_tab_detail7_incomplete'

                        if (hardnessVal != "") {
                            var decimalPoint = await calculateDp.precision(hardnessVal);
                            let fetchMstSerNo = {
                                str_tableName: mstTableName,
                                data: 'MstSerNo',
                                condition: [
                                    { str_colName: 'RepSerNo', value: objHardness.masterId, comp: 'eq' },
                                ]
                            }
                            var objfetchMstSerNo = await database.select(fetchMstSerNo);

                            //check Record is present or no*******************
                            let RecordPResent = {
                                str_tableName: DetTableName,
                                data: '*',
                                condition: [
                                    { str_colName: 'RepSerNo', value: objHardness.masterId, comp: 'eq' },
                                    { str_colName: 'RecSeqNo', value: objarrHardnessMT50Reading.sampleFromString, comp: 'eq' },
                                ]
                            }
                            var objRecordPResent = await database.select(RecordPResent);
                            /************************************************* */
                            if (objRecordPResent[0].length == 0) {
                                if (productlimits.Hardness.noOfSamples >= objHardness.sampleNo) {
                                    var detailObj = {
                                        str_tableName: 'tbl_tab_detail7_incomplete',
                                        data: [
                                            { str_colName: 'RepSerNo', value: objHardness.masterId },
                                            { str_colName: 'MstSerNo', value: objfetchMstSerNo[0][0].MstSerNo },
                                            { str_colName: 'RecSeqNo', value: strSampleNoFromString },
                                            { str_colName: 'DataValue', value: hardnessVal },
                                            { str_colName: 'DecimalPoint', value: decimalPoint }
                                        ]
                                    }
                                    const DetailsEntries = {
                                        str_tableName: "tbl_tab_detail7_incomplete",
                                        data: 'MAX(RecSeqNo) AS SeqNo',
                                        condition: [
                                            { str_colName: 'RepSerNo', value: objHardness.masterId, comp: 'eq' }
                                        ]
                                    }
                                    var tabDetails = await database.select(DetailsEntries)
                                    if (tabDetails[0][0].SeqNo == null) {
                                        var entries = 1
                                    } else {
                                        var entries = tabDetails[0][0].SeqNo + 1
                                    }

                                    if (entries == parseInt(objHardness.sampleNo)) {
                                        await database.save(detailObj)
                                    }
                                    else {
                                        //logFromPC.addtoProtocolLog(`sample no ${entries} recieved instead of ${objHardness.sampleNo}`)
                                        objHardness.sampleNo = objHardness.sampleNo - 1
                                    }

                                    let strsql = `select max(RecSeqNo) as RecSeqNo  from tbl_tab_detail7_incomplete where RepSerNo='${objHardness.masterId}'`
                                    let objMaxSerno = await database.execute(strsql)
                                    objarrHardnessMT50Reading.sampleFromString = objMaxSerno[0][0].RecSeqNo
                                }
                            }
                        }
                        if (objarrHardnessMT50Reading.SampleSkipped == false) {
                            objarrHardnessMT50Reading.RhCounter = 0
                        }
                        return protocolValue;
                    }
                } else {
                    if (objarrHardnessMT50Reading.atPresent == true) {
                        objarrHardnessMT50Reading.SampleSkipped = false
                        console.log('@ present')
                    } else {
                        objarrHardnessMT50Reading.SampleSkipped = true
                        console.log('@ not present')
                    }
                    return protocolValue;
                }
            }
        } catch (err) {
            objHardness.HardnessVal = [],
                objHardness.HardnessDecimal = 0,
                objHardness.HardnessNom = 0,
                objHardness.Hardnessrneg = 0,
                objHardness.Hardnesspos = 0

            objarrHardnessMT50Reading.Readingflag = false,
                objarrHardnessMT50Reading.RhCounter = 0,
                objarrHardnessMT50Reading.SampleSkipped = false,
                objarrHardnessMT50Reading.atPresent = false,
                objarrHardnessMT50Reading.sampleFromString = 0,
                objarrHardnessMT50Reading.localSampleCounter = 0

            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            ErrorLog.addToErrorLog(logError);
            console.log("error from Hardness Mt50", err)
            throw new Error(err);
        }
    }


    async insertPharmatronST50(IdsNo, protocol) {
        try {
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo);
            var mstSerNo = '';
            var sideNo = '';
            var strSampleNoFromString = '';
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var currentCubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            var actualProtocol = protocol;
            var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var protocolValue = protocol.substring(0, 5);// starting 5 character
            var protocolValueData = protocol.substring(5, protocol.length - 2);// starting 5 character
            var protocolIncomingType = protocolValue.substring(0, 1);//Check incoming Protocol is from "T" or "H"
            var productlimits = globalData.arr_limits.find(al => al.idsNo == IdsNo);
            var objHardness = globalData.arrHardnessMT50.find(ht => ht.idsNo == IdsNo);
            var objarrHardnessMT50Reading = globalData.arrHardnessMT50Reading.find(ht => ht.idsNo == IdsNo);
            var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
            var HardnessUnit = productlimits.Hardness == undefined ? 'N' : productlimits.Hardness.unit;

            let now = new Date();
            var pattern = /[^\x20-\x7E]/g;
            var side = "NA";
            if (productObj.Sys_RotaryType == "Single") {
                side = "NA";
            }
            else {
                if (productlimits.Hardness != undefined) {
                    side = productlimits.Hardness.side == "L" ? "LHS" : "RHS";
                } else {
                    side = 'LHS';
                }
            }
            var intNos = 0;
            if (productlimits.Hardness != undefined) {
                intNos = productlimits.Hardness.noOfSamples;
            } else if (productlimits.Thickness != undefined) {
                intNos = productlimits.Thickness.noOfSamples;
            } else if (productlimits.Breadth != undefined) {
                intNos = productlimits.Breadth.noOfSamples;
            } else if (productlimits.Length != undefined) {
                intNos = productlimits.Length.noOfSamples;
            } else {
                intNos = productlimits.Diameter.noOfSamples;
            }
            if (protocolValue == protocolIncomingType + "D001") {//hardness reading started
                objarrHardnessMT50Reading.Readingflag = true
                return protocolValue
            }

            if (protocolValue == protocolIncomingType + "D000") {

                if ((objarrHardnessMT50Reading.sampleFromString >= intNos &&
                    objarrHardnessMT50Reading.SampleSkipped == false) &&
                    ((objarrHardnessMT50Reading.sampleFromString - (parseFloat(objarrHardnessMT50Reading.localSampleCounter) + 1)) <= 0)) {

                    //check total number data present in table
                    var objchkchkLastInsrtedDataMT50 = await hardnessData.chkHardnessDataCount(side, IdsNo, 'ST50')

                    if (objchkchkLastInsrtedDataMT50 < intNos && objchkchkLastInsrtedDataMT50 != 0
                        && objchkchkLastInsrtedDataMT50 != 'NULL' && objchkchkLastInsrtedDataMT50 != undefined) {
                        let objclearHardnesVariable = this.clearHardnesVariable(IdsNo)
                        let result = 'HR41Incomplete Report,Generated,,,'
                        return result
                    }
                    else {
                        //var remarkRes = await hardnessData.saveHardnessDataMT50(objHardness.masterId, IdsNo);
                        var remarkRes = await hardnessData.saveHardnessDataST50(objHardness.masterId, IdsNo);
                        let objclearHardnesVariable = this.clearHardnesVariable(IdsNo)

                        let objActivity = {};
                        objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'HARDNESS', flag: 'COMPLETED' } });
                        await objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', '', 'completed');
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Hardness Weighment Completed on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        let appendProtocol = '';
                        if (protocolIncomingType == 'T') {
                            appendProtocol = 'TR3';
                        } else {
                            appendProtocol = 'HR3';
                        }
                        return `${appendProtocol},,,,,`;

                    }
                }


                if (((objarrHardnessMT50Reading.sampleFromString - (parseFloat(objarrHardnessMT50Reading.localSampleCounter) + 1)) > 0) ||
                    objarrHardnessMT50Reading.SampleSkipped == true) {
                    if (objarrHardnessMT50Reading.RhCounter != 2) {
                        objarrHardnessMT50Reading.RhCounter = objarrHardnessMT50Reading.RhCounter + 1
                        console.log('sending RH = ' + objarrHardnessMT50Reading.RhCounter)
                        let result = protocolIncomingType.includes('T') ? 'RT' : 'RH'//sending "RH" for repeat protocol
                        return result;
                    }
                    else if (objarrHardnessMT50Reading.RhCounter == 2) {
                        //this if block will check if sample received from string directly as '2' and 
                        //if sample from hardness is greater than qty set in cubicle than generate incomplete report
                        objarrHardnessMT50Reading.localSampleCounter = objarrHardnessMT50Reading.sampleFromString
                        if ((objarrHardnessMT50Reading.sampleFromString == 2 && objarrHardnessMT50Reading.localSampleCounter == 0) ||
                            (objarrHardnessMT50Reading.sampleFromString >= productlimits.Hardness.noOfSamples)) {
                            let objClearHardnessVariable = await this.clearHardnesVariable(IdsNo)
                            let result = 'HR41Incomplete Report,Generated,,,'
                            return result;
                        }
                        else {
                            objarrHardnessMT50Reading.Readingflag = false,
                                objarrHardnessMT50Reading.RhCounter = 0,
                                objarrHardnessMT50Reading.SampleSkipped = false,
                                objarrHardnessMT50Reading.atPresent = false
                            let result = `${protocolIncomingType}R0 ${objarrHardnessMT50Reading.sampleFromString} Samples Recived.,,,,,`
                            return result;
                        }
                    }
                }
                else {
                    //replace locla counter with actual sample value because there 
                    //we didnt get missed sample after 2 attempts
                    objarrHardnessMT50Reading.SampleSkipped = false
                    objHardness.sampleNo = objarrHardnessMT50Reading.localSampleCounter
                    console.log('local counter =' + objarrHardnessMT50Reading.localSampleCounter)
                    var HRDProtocol = `${protocolIncomingType}R0` + objHardness.sampleNo + " Samples Recived,,,,,";
                    objMonitor.monit({ case: 'HDT', idsNo: IdsNo, data: { sample: objHardness.sampleNo, flag: 'start' } });
                    objHardness.capacityFlag = true;
                    objHardness.hardnessFlag = false;
                    objHardness.oc = 0
                    return HRDProtocol;
                }
            }

            if (objarrHardnessMT50Reading.Readingflag = true) {
                if (protocolValueData.includes("@") && !protocolValueData.includes("@0")) {
                    objarrHardnessMT50Reading.atPresent = true  // set true if @ present
                    var thicknessVal = 0, widthVal = 0, diameterVal = 0, hardnessVal = 0;
                    // main logic to extract value from given line 
                    var str = protocolValueData
                    var strInvalidmsg = 'Invalid String'

                    strSampleNoFromString = str.substring(1, str.indexOf(' '))//to get sample number from string
                    if (isNaN(strSampleNoFromString) == true) {
                        console.log('invalid string =sample Not found')
                        return `${protocolIncomingType}R40${strInvalidmsg},,,,`;
                    }
                    else {
                        objarrHardnessMT50Reading.sampleFromString = strSampleNoFromString// saving sample no from hardness
                    }

                    //reseting the all varible which is used to save data for hardness*******/
                    if (strSampleNoFromString == 1 && objarrHardnessMT50Reading.RhCounter == 0) {
                        objHardness.HardnessVal = [],
                            objHardness.HardnessDecimal = 0,
                            objHardness.HardnessNom = 0,
                            objHardness.Hardnessrneg = 0,
                            objHardness.Hardnesspos = 0,
                            objHardness.thicknessVal = [],
                            objHardness.thicknessNom = 0,
                            objHardness.thicknesneg = 0,
                            objHardness.thicknespos = 0,
                            objHardness.WidthVal = [],
                            objHardness.WidthNom = 0,
                            objHardness.Widthneg = 0,
                            objHardness.Widthpos = 0,
                            objHardness.DiameterVal = [],
                            objHardness.DiametereNom = 0,
                            objHardness.Diameterneg = 0,
                            objHardness.Diameterpos = 0
                    }
                    //********************************************************************** */

                    if ((strSampleNoFromString - (parseFloat(objarrHardnessMT50Reading.localSampleCounter) + 1)) > 0) {
                        objarrHardnessMT50Reading.SampleSkipped = true
                    } else {
                        objarrHardnessMT50Reading.localSampleCounter++; //increment Local Counter by one
                        console.log('local counter while get data =' + objarrHardnessMT50Reading.localSampleCounter)
                        objarrHardnessMT50Reading.SampleSkipped = false
                    }

                    // for Thickness *************************************************************************
                    if (str.includes("T") && productlimits.Thickness != undefined) {
                        thicknessVal = str.substring(str.indexOf("T") + 1, str.indexOf("mm")).trim()
                        if (isNaN(thicknessVal) == false) {// if the received value is valid value
                            objHardness.thicknessVal = thicknessVal
                            objHardness.thicknessDecimal = await calculateDp.precision(thicknessVal);
                            objHardness.sampleNo = strSampleNoFromString
                        }
                        else {
                            objHardness.thicknessVal = 0;
                            objHardness.thicknessDecimal = 0;
                            objarrHardnessMT50Reading.localSampleCounter--;
                            return `${protocolIncomingType}R40${strInvalidmsg},,,,`;
                        }
                    }
                    else {
                        objHardness.thicknessVal = 0;
                        objHardness.thicknessDecimal = 0;
                        objHardness.sampleNo = strSampleNoFromString
                    }
                    /*********************************************************************************** */

                    // for Width *************************************************************************
                    if (str.includes('Wd') && productlimits.Breadth != undefined) {
                        let tempstring = str.substring(str.indexOf("Wd"))
                        widthVal = tempstring.substring(tempstring.indexOf("Wd") + 2, tempstring.indexOf("mm")).trim()
                        if (isNaN(widthVal) == false) {// if the received value is valid value
                            objHardness.WidthVal = widthVal;
                            objHardness.WidthDecimal = await calculateDp.precision(widthVal);
                            objHardness.sampleNo = strSampleNoFromString
                        }
                        else {
                            objHardness.WidthVal = 0;
                            objHardness.WidthDecimal = 0;
                            objarrHardnessMT50Reading.localSampleCounter--;
                            return `${protocolIncomingType}R40${strInvalidmsg},,,,`;
                        }
                    }
                    else {
                        objHardness.WidthVal = 0;
                        objHardness.WidthDecimal = 0;
                        objHardness.sampleNo = strSampleNoFromString
                    }
                    /*********************************************************************************** */

                    // for Diameter *************************************************************************
                    if (str.includes('D') && productlimits.Diameter != undefined) {
                        let tempstring = str.substring(str.indexOf("D") + 1)
                        diameterVal = tempstring.substring(0, tempstring.indexOf("mm")).trim()
                        if (isNaN(diameterVal) == false) {// if the received value is valid value
                            objHardness.DiameterVal = diameterVal;
                            objHardness.DiameterDecimal = await calculateDp.precision(diameterVal);
                            objHardness.sampleNo = strSampleNoFromString
                        }
                        else {
                            objHardness.DiameterVal = 0;
                            objHardness.DiameterDecimal = 0;
                            objarrHardnessMT50Reading.localSampleCounter--;
                            return `${protocolIncomingType}R40${strInvalidmsg},,,,`;
                        }
                    }
                    else {
                        objHardness.DiameterVal = 0;
                        objHardness.DiameterDecimal = 0;
                        objHardness.sampleNo = strSampleNoFromString
                    }
                    /*********************************************************************************** */

                    // for Hardness *************************************************************************
                    if (str.includes('H') && productlimits.Hardness != undefined) {
                        if (str.includes("N")) {
                            hardnessVal = str.substring(str.indexOf("H") + 1, str.indexOf("N")).trim()
                        }
                        else {
                            hardnessVal = str.substring(str.indexOf("H") + 1, str.indexOf("Kp")).trim()
                        }

                        if (isNaN(hardnessVal) == false) {// if the received value is valid value
                            objHardness.HardnessVal = hardnessVal;
                            objHardness.HardnessDecimal = await calculateDp.precision(hardnessVal);
                            objHardness.sampleNo = strSampleNoFromString
                        }
                        else {
                            objHardness.HardnessVal = 0;
                            objHardness.HardnessDecimal = 0;
                            objarrHardnessMT50Reading.localSampleCounter--;
                            return `${protocolIncomingType}R40${strInvalidmsg},,,,`;
                        }
                    }
                    else {
                        objHardness.HardnessVal = 0;
                        objHardness.HardnessDecimal = 0;
                        objHardness.sampleNo = strSampleNoFromString
                    }
                    /*********************************************************************************** */

                    //this will check if sample is came directly as 2 OR 
                    //sample came directly as eual to QTY
                    if ((strSampleNoFromString >= intNos && objarrHardnessMT50Reading.localSampleCounter == 0)
                        || ((parseFloat(strSampleNoFromString) != 1) && objarrHardnessMT50Reading.localSampleCounter == 0)) {
                        let objclearHardnesVariable = this.clearHardnesVariable(IdsNo)
                        console.log('invalid string = this will check if sample is came directly as 2 OR sample came directly as eual to QTY')
                        return `${protocolIncomingType}R40${strInvalidmsg},,,,`;
                    }

                    // storing master  and detail record on first sample 
                    if (strSampleNoFromString == 1 && objarrHardnessMT50Reading.localSampleCounter == 1) {
                        let objActivity = {};
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Hardness Weighment Started on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);

                        var mstTableName = 'tbl_tab_masterhtd_incomplete'
                        var DetTableName = 'tbl_tab_detailhtd_incomplete'

                        var res = await proObj.productData(productObj)
                        var objArrLimits = globalData.arrIdsInfo.find(k => k.idsNo == IdsNo);
                        if (productObj.Sys_RptType == 1) {//for Initial 
                            mstSerNo = 1
                            sideNo = 1
                        }
                        else { //regular
                            if (side == 'NA') {
                                mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                if (sideNo < 10) {
                                    sideNo = sideNo + 1;
                                }
                                else {
                                    sideNo = 1;
                                    mstSerNo = mstSerNo + 1;
                                }
                            }
                            else {
                                mstSerNo = await objGetMstSrAndSideSr.getRegularLRMstSerialNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                sideNo = await objGetMstSrAndSideSr.getRegularLRSideNo(mstTableName, 0, side, productObj.Sys_BFGCode, productObj.Sys_ProductName, productObj.Sys_PVersion, productObj.Sys_Version, productObj.Sys_Batch, IdsNo);
                                if (sideNo < 5) {
                                    sideNo = sideNo + 1;
                                }
                                else {
                                    sideNo = 1;
                                    mstSerNo = mstSerNo + 1;
                                }
                            }
                        }

                        var insertIncompleteObj = {
                            str_tableName: 'tbl_tab_masterhtd_incomplete',
                            data: [
                                { str_colName: 'MstSerNo', value: mstSerNo },
                                { str_colName: 'SideNo', value: sideNo },
                                { str_colName: 'InstruId', value: 1 },
                                { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                { str_colName: 'ProductType', value: ProductType.productType },
                                { str_colName: 'Idsno', value: IdsNo },
                                { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                { str_colName: 'BalanceId', value: productObj.Sys_BalID },
                                { str_colName: 'VernierId', value: productObj.Sys_VernierID },
                                { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                { str_colName: 'UserId', value: tempUserObject.UserId },
                                { str_colName: 'UserName', value: tempUserObject.UserName },
                                { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                                { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                                { str_colName: 'Side', value: side },
                                { str_colName: 'Qty', value: intNos },
                                { str_colName: 'Unit', value: HardnessUnit },
                                { str_colName: 'DecimalPoint', value: objHardness.HardnessDecimal },
                                { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                { str_colName: 'HardnessID', value: productObj.Sys_HardID },
                                { str_colName: 'CubicleName', value: productObj.Sys_dept },
                                { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                { str_colName: 'IsArchived', value: 0 },
                                { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                { str_colName: 'Version', value: productObj.Sys_Version },
                                { str_colName: 'ColHeadDOLOBO', value: "Bredth" },
                                { str_colName: 'NomThick', value: productlimits.Thickness == undefined ? 0 : productlimits.Thickness.nominal },
                                { str_colName: 'PosTolThick', value: productlimits.Thickness == undefined ? 0 : productlimits.Thickness.T2Pos },
                                { str_colName: 'NegTolThick', value: productlimits.Thickness == undefined ? 0 : productlimits.Thickness.T2Neg },
                                { str_colName: 'NomHard', value: productlimits.Hardness == undefined ? 0 : productlimits.Hardness.nominal },
                                { str_colName: 'PosTolHard', value: productlimits.Hardness == undefined ? 0 : productlimits.Hardness.T1Pos },
                                { str_colName: 'NegTolHard', value: productlimits.Hardness == undefined ? 0 : productlimits.Hardness.T1Neg },
                                { str_colName: 'NomDOLOBO', value: productlimits.Breadth == undefined ? 0 : productlimits.Breadth.nominal },
                                { str_colName: 'PosTolDOLOBO', value: productlimits.Breadth == undefined ? 0 : productlimits.Breadth.T2Pos },
                                { str_colName: 'NegTolDOLOBO', value: productlimits.Breadth == undefined ? 0 : productlimits.Breadth.T2Neg },

                                { str_colName: 'NomDiam', value: productlimits.Diameter == undefined ? 0 : productlimits.Diameter.nominal },
                                { str_colName: 'PosTolDiam', value: productlimits.Diameter == undefined ? 0 : productlimits.Diameter.T2Pos },
                                { str_colName: 'NegTolDiam', value: productlimits.Diameter == undefined ? 0 : productlimits.Diameter.T2Neg },

                                { str_colName: 'GraphType', value: productlimits.Hardness == undefined ? 0 : productlimits.Hardness.isonstd[0] },
                                { str_colName: 'RepoLabel11', value: currentCubicalObj.Sys_Validation },
                                { str_colName: 'Lot', value: objLotData.LotNo },
                                { str_colName: 'Area', value: productObj.Sys_Area },
                                { str_colName: 'Stage', value: productObj.Sys_Stage },
                                { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                                { str_colName: 'HTMake', value: 'ST50' },
                            ]
                        }

                        console.log(insertIncompleteObj)
                        var masterRes = await database.save(insertIncompleteObj);
                        objActivity = {};
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Hardness Weighment Started on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        objHardness.masterEntryFlag = false;


                        let tempObjHardness = globalData.arrHardnessMT50.find(ht => ht.idsNo == IdsNo);
                        objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', 'Hardness', 'started');
                        const insertDetailObj = {
                            str_tableName: 'tbl_tab_detailhtd_incomplete',
                            data: [
                                { str_colName: 'RepSerNo', value: masterRes[0].insertId },
                                { str_colName: 'MstSerNo', value: 0 },
                                { str_colName: 'RecSeqNo', value: tempObjHardness.sampleNo },
                                { str_colName: 'DataValueThick', value: tempObjHardness.thicknessVal == 0 ? 0 : tempObjHardness.thicknessVal },
                                { str_colName: 'DataValueDOLOBO', value: tempObjHardness.WidthVal == 0 ? 0 : tempObjHardness.WidthVal },
                                { str_colName: 'DataValueHard', value: tempObjHardness.HardnessVal == 0 ? 0 : tempObjHardness.HardnessVal },
                                { str_colName: 'DataValueDiam', value: tempObjHardness.DiameterVal == 0 ? 0 : tempObjHardness.DiameterVal },
                                { str_colName: 'DecimalPointThick', value: tempObjHardness.thicknessDecimal == 0 ? 0 : tempObjHardness.thicknessDecimal },
                                { str_colName: 'DecimalPointDOLOBO', value: tempObjHardness.WidthDecimal == 0 ? 0 : tempObjHardness.WidthDecimal },
                                { str_colName: 'DecimalPointHard', value: tempObjHardness.HardnessDecimal == 0 ? 0 : tempObjHardness.HardnessDecimal },
                                { str_colName: 'DecimalPointDiam', value: tempObjHardness.DiameterDecimal == 0 ? 0 : tempObjHardness.DiameterDecimal },
                                { str_colName: 'idsNo', value: parseInt(tempObjHardness.idsNo) }
                            ]
                        }
                        const DetailsEntries = {
                            str_tableName: "tbl_tab_detailhtd_incomplete",
                            data: 'MAX(RecSeqNo) AS SeqNo',
                            condition: [
                                { str_colName: 'RepSerNo', value: masterRes[0].insertId, comp: 'eq' }
                            ]
                        }
                        var tabDetails = await database.select(DetailsEntries)
                        if (tabDetails[0][0].SeqNo == null) {
                            var entries = 1
                        } else {
                            var entries = tabDetails[0][0].SeqNo + 1
                        }

                        if (entries == objHardness.sampleNo) {
                            let objinsertDetailObj = await database.save(insertDetailObj)
                        }

                        objHardness.masterId = masterRes[0].insertId;
                        return protocolValue;
                    } else {// if sample is greater than 1
                        var mstTableName = 'tbl_tab_masterhtd_incomplete'
                        var DetTableName = 'tbl_tab_detailhtd_incomplete'

                        if (hardnessVal != "" || hardnessVal == 0) {
                            var decimalPoint = await calculateDp.precision(hardnessVal);
                            let fetchMstSerNo = {
                                str_tableName: mstTableName,
                                data: 'MstSerNo',
                                condition: [
                                    { str_colName: 'RepSerNo', value: objHardness.masterId, comp: 'eq' },
                                ]
                            }
                            var objfetchMstSerNo = await database.select(fetchMstSerNo);

                            //check Record is present or not*******************
                            let RecordPResent = {
                                str_tableName: DetTableName,
                                data: '*',
                                condition: [
                                    { str_colName: 'RepSerNo', value: objHardness.masterId, comp: 'eq' },
                                    { str_colName: 'RecSeqNo', value: objarrHardnessMT50Reading.sampleFromString, comp: 'eq' },
                                ]
                            }
                            var objRecordPResent = await database.select(RecordPResent);
                            /************************************************* */

                            let tempObjHardness = globalData.arrHardnessMT50.find(ht => ht.idsNo == IdsNo);

                            if (objRecordPResent[0].length == 0) {
                                if (intNos >= objHardness.sampleNo) {
                                    var detailObj = {
                                        str_tableName: 'tbl_tab_detailhtd_incomplete',
                                        data: [
                                            { str_colName: 'RepSerNo', value: tempObjHardness.masterId },
                                            { str_colName: 'MstSerNo', value: 0 },
                                            { str_colName: 'RecSeqNo', value: tempObjHardness.sampleNo },
                                            { str_colName: 'DataValueThick', value: tempObjHardness.thicknessVal == 0 ? 0 : tempObjHardness.thicknessVal },
                                            { str_colName: 'DataValueDOLOBO', value: tempObjHardness.WidthVal == 0 ? 0 : tempObjHardness.WidthVal },
                                            { str_colName: 'DataValueHard', value: tempObjHardness.HardnessVal == 0 ? 0 : tempObjHardness.HardnessVal },
                                            { str_colName: 'DataValueDiam', value: tempObjHardness.DiameterVal == 0 ? 0 : tempObjHardness.DiameterVal },
                                            { str_colName: 'DecimalPointThick', value: tempObjHardness.thicknessDecimal == 0 ? 0 : tempObjHardness.thicknessDecimal },
                                            { str_colName: 'DecimalPointDOLOBO', value: tempObjHardness.WidthDecimal == 0 ? 0 : tempObjHardness.WidthDecimal },
                                            { str_colName: 'DecimalPointHard', value: tempObjHardness.HardnessDecimal == 0 ? 0 : tempObjHardness.HardnessDecimal },
                                            { str_colName: 'DecimalPointDiam', value: tempObjHardness.DiameterDecimal == 0 ? 0 : tempObjHardness.DiameterDecimal },
                                            { str_colName: 'idsNo', value: parseInt(tempObjHardness.idsNo) }

                                        ]
                                    }
                                    const DetailsEntries = {
                                        str_tableName: "tbl_tab_detailhtd_incomplete",
                                        data: 'MAX(RecSeqNo) AS SeqNo',
                                        condition: [
                                            { str_colName: 'RepSerNo', value: tempObjHardness.masterId, comp: 'eq' }
                                        ]
                                    }
                                    var tabDetails = await database.select(DetailsEntries)
                                    if (tabDetails[0][0].SeqNo == null) {
                                        var entries = 1
                                    } else {
                                        var entries = tabDetails[0][0].SeqNo + 1
                                    }

                                    if (entries == objHardness.sampleNo) {
                                        let detailRes = await database.save(detailObj);
                                    }

                                    if (entries == objHardness.sampleNo) {
                                        let detailRes = await database.save(detailObj);
                                    }
                                    else {
                                        //logFromPC.addtoProtocolLog(`sample no ${entries} recieved instead of ${objHardness.sampleNo}`)
                                        objHardness.sampleNo = objHardness.sampleNo - 1
                                    }

                                    let strsql = `select max(RecSeqNo) as RecSeqNo  from tbl_tab_detailhtd_incomplete where RepSerNo='${tempObjHardness.masterId}'`
                                    let objMaxSerno = await database.execute(strsql)
                                    objarrHardnessMT50Reading.sampleFromString = objMaxSerno[0][0].RecSeqNo
                                }
                            }
                        }
                        if (objarrHardnessMT50Reading.SampleSkipped == false) {
                            objarrHardnessMT50Reading.RhCounter = 0
                        }
                        return protocolValue;
                    }
                } else {
                    if (objarrHardnessMT50Reading.atPresent == true) {
                        objarrHardnessMT50Reading.SampleSkipped = false
                        console.log('@ present')
                    } else {
                        objarrHardnessMT50Reading.SampleSkipped = true
                        console.log('@ not present')
                    }
                    return protocolValue;
                }
            }
        } catch (err) {
            var objHardness = globalData.arrHardnessMT50.find(ht => ht.idsNo == IdsNo);
            objHardness.HardnessVal = [],
                objHardness.HardnessDecimal = 0,
                objHardness.HardnessNom = 0,
                objHardness.Hardnessrneg = 0,
                objHardness.Hardnesspos = 0,
                objHardness.thicknessVal = [],
                objHardness.thicknessNom = 0,
                objHardness.thicknesneg = 0,
                objHardness.thicknespos = 0,
                objHardness.WidthVal = [],
                objHardness.WidthNom = 0,
                objHardness.Widthneg = 0,
                objHardness.Widthpos = 0,
                objHardness.DiameterVal = [],
                objHardness.DiametereNom = 0,
                objHardness.Diameterneg = 0,
                objHardness.Diameterpos = 0

            objarrHardnessMT50Reading.Readingflag = false,
                objarrHardnessMT50Reading.RhCounter = 0,
                objarrHardnessMT50Reading.SampleSkipped = false,
                objarrHardnessMT50Reading.atPresent = false,
                objarrHardnessMT50Reading.sampleFromString = 0,
                objarrHardnessMT50Reading.localSampleCounter = 0

            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            ErrorLog.addToErrorLog(logError);
            console.log("error from Hardness Mt50", err)
            throw new Error(err);
        }
    }
    async insertST50TCP(data = [], host) {
        try {
            // console.log(data);
            let IdsNo = await fetchDetails.getIPTCP(host, 'ids');
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo);
            var mstSerNo = '';
            var sideNo = '';
            var strSampleNoFromString = '';
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var currentCubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var productlimits = globalData.arr_limits.find(al => al.idsNo == IdsNo);
            var ProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
            var objHardness = globalData.arrHardnessMT50.find(ht => ht.idsNo == IdsNo);
            var HardnessUnit = productlimits.Hardness.unit;
            if (productlimits.Length != undefined) {
                objHardness.colName = "Length";
                objHardness.opNominal = productlimits.Length.nominal;
                objHardness.opNegTol = productlimits.Length.T2Neg;
                objHardness.opPosTol = productlimits.Length.T2Pos;
            }
            else if (productlimits.Breadth != undefined) {
                objHardness.colName = "Breadth";
                objHardness.opNominal = productlimits.Breadth.nominal;
                objHardness.opNegTol = productlimits.Breadth.T2Neg;
                objHardness.opPosTol = productlimits.Breadth.T2Pos;
            }
            else {
                objHardness.colName = "NA";
                objHardness.opNominal = 0;
                objHardness.opNegTol = 0;
                objHardness.opPosTol = 0;
            }

            if (productlimits.Thickness == undefined) {
                objHardness.thicknessNom = 0;
                objHardness.thicknesneg = 0;
                objHardness.thicknespos = 0;
            }
            else {
                objHardness.thicknessNom = productlimits.Thickness.nominal;
                objHardness.thicknesneg = productlimits.Thickness.T2Neg;
                objHardness.thicknespos = productlimits.Thickness.T2Pos;
            }
            if (productlimits.Diameter == undefined) {
                objHardness.DiametereNom = 0;
                objHardness.Diameterneg = 0;
                objHardness.Diameterpos = 0;
            }
            else {
                objHardness.DiametereNom = productlimits.Diameter.nominal;
                objHardness.thicknesneg = productlimits.Diameter.T2Neg;
                objHardness.thicknespos = productlimits.Diameter.T2Pos;
            }
            let now = new Date();
            var side = "NA";
            if (productObj.Sys_RotaryType == "Single") {
                side = "NA";
            }
            else {
                side = productlimits.Hardness.side == "L" ? "LHS" : "RHS";
            }
            for await (let variable of data) {

                if (variable.includes('TestValues')) {
                    console.log(variable);
                    let sample = variable.split(';').filter(item => item.indexOf('Sample') !== -1)[0].split('=')[1]
                    let arrExistThickness = variable.split(';').filter(item => item.indexOf('Thickness') !== -1);
                    let arrExistDiameter = variable.split(';').filter(item => item.indexOf('Diameter') !== -1);
                    let arrExistWidth = variable.split(';').filter(item => item.indexOf('Width') !== -1);
                    let arrExistHardness = variable.split(';').filter(item => item.indexOf('Hardness') !== -1);
                    let intThickness = 0, intDiameter = 0, intHardness = 0, intWidth = 0;
                    if (arrExistThickness.length) intThickness = arrExistThickness[0].split('=')[1];
                    if (arrExistDiameter.length) intDiameter = arrExistDiameter[0].split('=')[1];
                    if (arrExistWidth.length) intWidth = arrExistWidth[0].split('=')[1];
                    if (arrExistHardness.length) intHardness = arrExistHardness[0].split('=')[1];
                    console.log('sample:', sample)
                    console.log('intThickness:', intThickness);
                    //Thickness
                    if (intThickness != 0 && productlimits.Thickness != undefined) {
                        if (isNaN(intThickness) == false) {// if the received value is valid value
                            objHardness.thicknessVal = intThickness
                            objHardness.thicknessDecimal = await calculateDp.precision(intThickness);
                            objHardness.sampleNo = sample
                        }
                        else {
                            objHardness.thicknessVal = 0;
                            objHardness.thicknessDecimal = 0;
                            console.log('Invalid Thickness')
                        }
                    } else {
                        objHardness.thicknessVal = 0;
                        objHardness.thicknessDecimal = 0;
                    }

                    console.log('intDiameter:', intDiameter);
                    // Diameter
                    if (intDiameter != 0 && productlimits.Diameter != undefined) {
                        if (isNaN(intDiameter) == false) {// if the received value is valid value
                            objHardness.DiameterVal = intDiameter
                            objHardness.DiameterDecimal = await calculateDp.precision(intDiameter);
                            objHardness.sampleNo = sample
                        }
                        else {
                            objHardness.DiameterVal = 0;
                            objHardness.DiameterDecimal = 0;
                            console.log('Invalid Thickness')
                        }
                    } else {
                        objHardness.DiameterVal = 0;
                        objHardness.DiameterDecimal = 0;
                    }
                    console.log('intHardness:', intHardness)
                    //Hardness
                    if (intHardness != 0 && productlimits.Hardness != undefined) {
                        if (isNaN(intHardness) == false) {// if the received value is valid value
                            objHardness.HardnessVal = intHardness
                            objHardness.HardnessDecimal = await calculateDp.precision(intHardness);
                            objHardness.sampleNo = sample
                        }
                        else {
                            objHardness.HardnessVal = 0;
                            objHardness.HardnessDecimal = 0;
                            console.log('Invalid Thickness')
                        }
                    } else {
                        objHardness.HardnessVal = 0;
                        objHardness.HardnessDecimal = 0;
                    }
                    console.log('intWidth:', intWidth)
                    //Width
                    if (intWidth != 0 && productlimits.Breadth != undefined) {
                        if (isNaN(intWidth) == false) {// if the received value is valid value
                            objHardness.WidthVal = intWidth
                            objHardness.WidthDecimal = await calculateDp.precision(intWidth);
                            objHardness.sampleNo = sample
                        }
                        else {
                            objHardness.WidthVal = 0;
                            objHardness.WidthDecimal = 0;
                            console.log('Invalid Thickness')
                        }
                    } else {
                        objHardness.WidthVal = 0;
                        objHardness.WidthDecimal = 0;
                    }
                    if (sample == 1) {
                        var insertIncompleteObj = {
                            str_tableName: 'tbl_tab_masterhtd_incomplete',
                            data: [
                                { str_colName: 'MstSerNo', value: 0 },
                                { str_colName: 'SideNo', value: 0 },
                                { str_colName: 'InstruId', value: 1 },
                                { str_colName: 'BFGCode', value: productObj.Sys_BFGCode },
                                { str_colName: 'ProductName', value: productObj.Sys_ProductName },
                                { str_colName: 'ProductType', value: ProductType.productType },
                                { str_colName: 'Idsno', value: IdsNo },
                                { str_colName: 'CubicalNo', value: productObj.Sys_CubicNo },
                                { str_colName: 'BalanceId', value: productObj.Sys_BalID },
                                { str_colName: 'VernierId', value: productObj.Sys_VernierID },
                                { str_colName: 'BatchNo', value: productObj.Sys_Batch },
                                { str_colName: 'UserId', value: tempUserObject.UserId },
                                { str_colName: 'UserName', value: tempUserObject.UserName },
                                { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                                { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                                { str_colName: 'Side', value: side },
                                { str_colName: 'Qty', value: productlimits.Hardness.noOfSamples },
                                { str_colName: 'Unit', value: HardnessUnit },
                                { str_colName: 'DecimalPoint', value: 0 },
                                { str_colName: 'CubicleType', value: productObj.Sys_CubType },
                                { str_colName: 'ReportType', value: productObj.Sys_RptType },
                                { str_colName: 'MachineCode', value: productObj.Sys_MachineCode },
                                { str_colName: 'MFGCode', value: productObj.Sys_MfgCode },
                                { str_colName: 'BatchSize', value: `${productObj.Sys_BatchSize} ${productObj.Sys_BatchSizeUnit}` },
                                { str_colName: 'HardnessID', value: productObj.Sys_HardID },
                                { str_colName: 'CubicleName', value: productObj.Sys_dept },
                                { str_colName: 'CubicleLocation', value: productObj.Sys_dept },
                                { str_colName: 'IsArchived', value: 0 },
                                { str_colName: 'PVersion', value: productObj.Sys_PVersion },
                                { str_colName: 'Version', value: productObj.Sys_Version },
                                { str_colName: 'ColHeadDOLOBO', value: objHardness.colName },
                                { str_colName: 'NomThick', value: objHardness.thicknessNom },
                                { str_colName: 'PosTolThick', value: objHardness.thicknespos },
                                { str_colName: 'NegTolThick', value: objHardness.thicknesneg },
                                { str_colName: 'NomHard', value: productlimits.Hardness.nominal },
                                { str_colName: 'PosTolHard', value: productlimits.Hardness.T1Pos },
                                { str_colName: 'NegTolHard', value: productlimits.Hardness.T1Neg },
                                { str_colName: 'NomDOLOBO', value: objHardness.opNominal },
                                { str_colName: 'PosTolDOLOBO', value: objHardness.opPosTol },
                                { str_colName: 'NegTolDOLOBO', value: objHardness.opNegTol },

                                { str_colName: 'NomDiam', value: objHardness.DiametereNom },
                                { str_colName: 'PosTolDiam', value: objHardness.Diameterpos },
                                { str_colName: 'NegTolDiam', value: objHardness.Diameterneg },

                                { str_colName: 'GraphType', value: productlimits.Hardness.isonstd[0] },
                                { str_colName: 'RepoLabel11', value: currentCubicalObj.Sys_Validation },
                                { str_colName: 'Lot', value: objLotData.LotNo },
                                { str_colName: 'Area', value: productObj.Sys_Area },
                                { str_colName: 'Stage', value: productObj.Sys_Stage },
                                { str_colName: 'AppearanceDesc', value: productObj.Sys_Appearance },
                                { str_colName: 'MachineSpeed_Min', value: productObj.Sys_MachineSpeed_Min },
                                { str_colName: 'MachineSpeed_Max', value: productObj.Sys_MachineSpeed_Max },
                                { str_colName: 'GenericName', value: productObj.Sys_GenericName },
                                { str_colName: 'BMRNo', value: productObj.Sys_BMRNo },
                            ]
                        }
                        let masterRes = await database.save(insertIncompleteObj);
                        objHardness.masterId = masterRes[0].insertId;
                        let objActivity = {};
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Hardness Weighment Started on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        objHardness.masterEntryFlag = false;


                        let tempObjHardness = globalData.arrHardnessMT50.find(ht => ht.idsNo == IdsNo);
                        objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', 'Hardness', 'started');
                        const insertDetailObj = {
                            str_tableName: 'tbl_tab_detailhtd_incomplete',
                            data: [
                                { str_colName: 'RepSerNo', value: masterRes[0].insertId },
                                { str_colName: 'MstSerNo', value: 0 },
                                { str_colName: 'RecSeqNo', value: sample },
                                { str_colName: 'DataValueThick', value: tempObjHardness.thicknessVal == 0 ? 0 : tempObjHardness.thicknessVal },
                                { str_colName: 'DataValueDOLOBO', value: tempObjHardness.WidthVal == 0 ? 0 : tempObjHardness.WidthVal },
                                { str_colName: 'DataValueHard', value: tempObjHardness.HardnessVal == 0 ? 0 : tempObjHardness.HardnessVal },
                                { str_colName: 'DataValueDiam', value: tempObjHardness.DiameterVal == 0 ? 0 : tempObjHardness.DiameterVal },
                                { str_colName: 'DecimalPointThick', value: tempObjHardness.thicknessDecimal == 0 ? 0 : tempObjHardness.thicknessDecimal },
                                { str_colName: 'DecimalPointDOLOBO', value: tempObjHardness.WidthDecimal == 0 ? 0 : tempObjHardness.WidthDecimal },
                                { str_colName: 'DecimalPointHard', value: tempObjHardness.HardnessDecimal == 0 ? 0 : tempObjHardness.HardnessDecimal },
                                { str_colName: 'DecimalPointDiam', value: tempObjHardness.DiameterDecimal == 0 ? 0 : tempObjHardness.DiameterDecimal },
                                { str_colName: 'idsNo', value: parseInt(tempObjHardness.idsNo) }
                            ]
                        }
                        let objinsertDetailObj = await database.save(insertDetailObj)

                    } else {
                        let tempObjHardness = globalData.arrHardnessMT50.find(ht => ht.idsNo == IdsNo);

                        const insertDetailObj = {
                            str_tableName: 'tbl_tab_detailhtd_incomplete',
                            data: [
                                { str_colName: 'RepSerNo', value: tempObjHardness.masterId },
                                { str_colName: 'MstSerNo', value: 0 },
                                { str_colName: 'RecSeqNo', value: sample },
                                { str_colName: 'DataValueThick', value: tempObjHardness.thicknessVal == 0 ? 0 : tempObjHardness.thicknessVal },
                                { str_colName: 'DataValueDOLOBO', value: tempObjHardness.WidthVal == 0 ? 0 : tempObjHardness.WidthVal },
                                { str_colName: 'DataValueHard', value: tempObjHardness.HardnessVal == 0 ? 0 : tempObjHardness.HardnessVal },
                                { str_colName: 'DataValueDiam', value: tempObjHardness.DiameterVal == 0 ? 0 : tempObjHardness.DiameterVal },
                                { str_colName: 'DecimalPointThick', value: tempObjHardness.thicknessDecimal == 0 ? 0 : tempObjHardness.thicknessDecimal },
                                { str_colName: 'DecimalPointDOLOBO', value: tempObjHardness.WidthDecimal == 0 ? 0 : tempObjHardness.WidthDecimal },
                                { str_colName: 'DecimalPointHard', value: tempObjHardness.HardnessDecimal == 0 ? 0 : tempObjHardness.HardnessDecimal },
                                { str_colName: 'DecimalPointDiam', value: tempObjHardness.DiameterDecimal == 0 ? 0 : tempObjHardness.DiameterDecimal },
                                { str_colName: 'idsNo', value: parseInt(tempObjHardness.idsNo) }
                            ]
                        }
                        let objinsertDetailObj = await database.save(insertDetailObj)
                    }
                    if (sample < productlimits.Hardness.noOfSamples) {
                        let result = `TR0 ${sample} Samples Recived.,,,,,`
                        this.sendProtocolTOUDP(result, serverConfig.strIpSeries + IdsNo);
                    } else {
                        let tempObjHardness = globalData.arrHardnessMT50.find(ht => ht.idsNo == IdsNo);
                        var remarkRes = await hardnessData.saveHardnessDataST50(tempObjHardness.masterId, IdsNo);
                        let objActivity = {};
                        // objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'HARDNESS', flag: 'COMPLETED' } });
                        await objInstrumentUsage.InstrumentUsage('Hardness', IdsNo, 'tbl_instrumentlog_hardness', '', 'completed');
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Hardness Weighment Completed on IDS' + IdsNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        let appendProtocol = 'TR3';
                        this.sendProtocolTOUDP(appendProtocol, serverConfig.strIpSeries + IdsNo);
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    }
    /**
     * @description LOD Data Come here
     * @param {*} IdsNo
     * @param {*} protocol
     */
    insertBulkWeighmentLOD(IdsNo, protocol) {
        return new Promise((resolve, reject) => {
            var actualProtocol = protocol;
            let now = new Date();
            var tdValue = actualProtocol.substring(0, 5);//starting 
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var protocolIncomingType = tdValue.substring(0, 1);//here incoming protocol is check T Or H
            if (tdValue != 'HD000' && tdValue != "TD000" && tdValue != "ED000") {
                /**
                * @description We are here setting TD000 and HD000 to false
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }
                /************************************************************* */
                var objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsNo);
                // objLodData.arr = [];
                var startTime = actualProtocol.includes("Mod.");
                if (startTime == true) {
                    console.log(date.format(now, 'HH:mm:ss'));
                    objLodData.Time = date.format(now, 'HH:mm:ss')

                }

                var iniWt = actualProtocol.includes("IniWt");
                if (iniWt == true) {
                    var iniWtActualVal = actualProtocol.split('+')[1];
                    var iniWtVal = iniWtActualVal.trim();
                    var initialWt = iniWtVal.replace(/\s+/g, '|').split('|')[0].trim();
                    var iniWeight = { 'iniWt': initialWt, 'flag': true };
                    //globalData.arrLodData.push(iniWeight);
                    objLodData.arr.push(iniWeight);

                    // Activity Log for LOD start
                    var objActivity = {};
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'LOD Weighment Started on IDS' + IdsNo });
                    objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                    // Instrument usage for LOD started
                    objInstrumentUsage.InstrumentUsage('LOD', IdsNo, 'tbl_instrumentlog_lod', 'LOD', 'started');
                }
                var setTemp = actualProtocol.includes("Fin. temp");
                if (setTemp == true) {
                    var setTempActualVal = actualProtocol.replace(/\s+/g, '|').split('|')[3].trim();
                    var setTempVal = setTempActualVal.trim();
                    var objSetTempVal = { 'setTemp': setTempVal, 'flag': true };
                    // globalData.arrLodData.push(iniWeight);
                    objLodData.arr.push(objSetTempVal);
                }
                var finWt = actualProtocol.includes("FinWt");
                if (finWt == true) {
                    var finWtActualVal = actualProtocol.split('+')[1];
                    var finWtVal = finWtActualVal.trim();
                    var finalWt = finWtVal.replace(/\s+/g, '|').split('|')[0].trim();
                    var finWeight = { 'finalWt': finalWt, 'flag': false };
                    // globalData.arrLodData.push(finWeight);
                    objLodData.arr.push(finWeight);
                }
                var finpres = objLodData.arr.filter(k => k.hasOwnProperty('finalWt'))
                if (finpres.length == 1) {
                    var abort = actualProtocol.includes('B')
                    if (abort == true) {
                        var abort = { 'abort': true };
                        objLodData.arr.push(abort);
                    }
                }
                resolve(tdValue);
            }
            else {
                /**
                * @description We are here setting TD000 and HD000 to true
                */
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                console.log(tempTDHD)
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    var objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsNo);
                    const IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
                    var selectedIds;
                    if (IPQCObject != undefined) {
                        selectedIds = IPQCObject.selectedIds
                    } else {
                        selectedIds = IdsNo; // for compression and coating
                    };
                    var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                    // lodData.saveLodData(productObj,globalData.arrLodData,tempUserObject);
                    var resultRecevied = ""
                    lodData.saveLodData(productObj, objLodData.arr, tempUserObject, IdsNo, protocolIncomingType, objLodData).then(res => {
                        var objUpdateValidation = {
                            str_tableName: "tbl_cubical",
                            data: [
                                { str_colName: 'Sys_Validation', value: 0 },
                            ],
                            condition: [
                                { str_colName: 'Sys_IDSNo', value: IdsNo },
                            ]
                        }
                        if (res == 'Invalid data string') {
                            let msg = `${protocolIncomingType}R40Invalid String,,,,`;
                            objInstrumentUsage.InstrumentUsage('LOD', IdsNo, 'tbl_instrumentlog_lod', '', 'ended');
                            //let msg = `${protocolIncomingType}R40INVALID DATA,RECEIVED,RETRANSMIT DATA,,`;
                            resolve(msg);
                        } else {
                            resultRecevied = res;
                            database.update(objUpdateValidation).catch(err => console.log(err));

                            // Instrument usage for LOD started
                            var objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsNo);
                            // objLodData.arr = [];
                            objInstrumentUsage.InstrumentUsage('LOD', IdsNo, 'tbl_instrumentlog_lod', '', 'completed');
                            resolve(resultRecevied);
                        }
                    }).catch(err => {
                        resolve('+')
                    });
                    // Activity Log for LOD start
                } else {
                    console.log('REPEAT_COUNT FOR TDHD000');
                    resolve('+')
                }
            }

        })
    }

    async insertBulkWeighmentLODHS153(IdsNo, protocol) {

        var actualProtocol = protocol;
        let now = new Date();
        var tdValue = actualProtocol.substring(0, 5);//starting 
        const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
        var protocolIncomingType = tdValue.substring(0, 1);//here incoming protocol is check T Or H
        if (tdValue != 'HD000' && tdValue != "TD000" && tdValue != "ED000") {
            /**
            * @description We are here setting TD000 and HD000 to false
            */
            var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
            if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
            else { tempTDHD.flag = false; tempTDHD.oc = 0 }
            /************************************************************* */
            var objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsNo);

            var Ins_Mod_Type = actualProtocol.includes("Type");
            if (Ins_Mod_Type) {
                console.log(actualProtocol);
                var mod = actualProtocol.replace(/\s\s+/g, ' ');
                mod = mod.split(" ")[1];
                mod = mod.split(/[NRnr]+/)[0]
                var objSetMod = { 'Modal': mod };
                objLodData.arr.push(objSetMod);

            }

            let arrToObj = objLodData.arr.reduce(((r, c) => Object.assign(r, c)), {})
            var mod = arrToObj["Modal"]

            if (mod == "HS153") {
                await this.HS153(IdsNo, actualProtocol);
            }
            else if (mod == "HX204") {
                await this.HX204(IdsNo, actualProtocol)
            }

            var iniWt = actualProtocol.includes("IniWt");
            if (iniWt == true) {
                var iniWtActualVal = actualProtocol.split('+')[1];
                var iniWtVal = iniWtActualVal.trim();
                var initialWt = iniWtVal.split(' ')[0];
                var iniWeight = { 'iniWt': initialWt, 'flag': true, type: "MA100Q" };
                //globalData.arrLodData.push(iniWeight);
                objLodData.arr.push(iniWeight);

                // Activity Log for LOD start
                var objActivity = {};
                Object.assign(objActivity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                    { activity: 'LOD Weighment Started on IDS' + IdsNo });
                objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });
                // Instrument usage for LOD started
                objInstrumentUsage.InstrumentUsage('LOD', IdsNo, 'tbl_instrumentlog_lod', 'LOD', 'started');
            }
            var setTemp = actualProtocol.includes("Fin. temp");
            if (setTemp == true) {
                var setTempActualVal = actualProtocol.split('temp.')[1].split(' ')[2];
                var setTempVal = setTempActualVal.trim();
                var objSetTempVal = { 'setTemp': setTempVal, 'flag': true };
                // globalData.arrLodData.push(iniWeight);
                objLodData.arr.push(objSetTempVal);
            }
            var finWt = actualProtocol.includes("FinWt");
            if (finWt == true) {
                var finWtActualVal = actualProtocol.split('+')[1];
                var finWtVal = finWtActualVal.trim();
                var finalWt = finWtVal.split(' ')[0];
                var finWeight = { 'finalWt': finalWt, 'flag': true };
                //globalData.arrLodData.push(finWeight);
                objLodData.arr.push(finWeight);
            }




            return tdValue
        }
        else {
            /**
            * @description We are here setting TD000 and HD000 to true
            */
            var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
            tempTDHD.flag = true;
            tempTDHD.oc = tempTDHD.oc + 1;
            /************************************************************* */
            if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                var objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsNo);
                const IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
                var selectedIds;
                if (IPQCObject != undefined) {
                    selectedIds = IPQCObject.selectedIds
                } else {
                    selectedIds = IdsNo; // for compression and coating
                };
                var productObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                // lodData.saveLodData(productObj,globalData.arrLodData,tempUserObject);
                var resultRecevied = ""
                var res = await lodData.saveLodData(productObj, objLodData.arr, tempUserObject, IdsNo, protocolIncomingType)
                var objUpdateValidation = {
                    str_tableName: "tbl_cubical",
                    data: [
                        { str_colName: 'Sys_Validation', value: 0 },
                    ],
                    condition: [
                        { str_colName: 'Sys_IDSNo', value: IdsNo },
                    ]
                }
                if (res == 'Invalid data string') {
                    let msg = `${protocolIncomingType}R40Invalid String,,,,`;
                    //let msg = `${protocolIncomingType}R40INVALID DATA,RECEIVED,RETRANSMIT DATA,,`
                    objInstrumentUsage.InstrumentUsage('LOD', IdsNo, 'tbl_instrumentlog_lod', '', 'ended');
                    return msg
                } else {
                    resultRecevied = res;
                    await database.update(objUpdateValidation).catch(err => console.log(err));

                    // Instrument usage for LOD started
                    var objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsNo);
                    // objLodData.arr = [];
                    objInstrumentUsage.InstrumentUsage('LOD', IdsNo, 'tbl_instrumentlog_lod', '', 'completed');
                    return resultRecevied
                }

            } else {
                console.log('REPEAT_COUNT FOR TDHD000');
                return '+';
            }
        }


    }

    /*****LOD MODAL PARSING HERE Updated by vivek on 16-sept-2021******** */
    async HS153(IdsNo, actualProtocol) {


        var objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsNo);
        var start_weight = actualProtocol.includes("Start Weight");


        if (start_weight == true) {
            let objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsNo);
            objLodData.counter = objLodData.counter + 1;

            if (serverConfig.ProjectName == 'CIPLA_INDORE') {

                if (objLodData.counter == 2) {
                    let value = actualProtocol.split('Weight')[1].trim()
                    let Weight = value.split(" ")[0];
                    let startWeight = { 'iniWt': Weight, 'flag': true, type: 153 };
                    objLodData.arr.push(startWeight);
                    objLodData.counter = 0
                }

            }
        }

        var dry_weight = actualProtocol.includes("Dry Weight");
        if (dry_weight == true) {
            console.log(actualProtocol);
            let value = actualProtocol.split('Weight')[1].trim()
            let Weight = value.split(" ")[0];
            let dryWeight = { 'finalWt': Weight, 'flag': true };
            objLodData.arr.push(dryWeight);

        }

        var drying_Temp = actualProtocol.includes("Drying Temp");
        if (drying_Temp == true) {

            let temp = actualProtocol.split('Temp')[1].trim()
            let temperature = temp.split(" ")[0];
            let dryTemp = { 'setTemp': temperature, 'flag': true };
            objLodData.arr.push(dryTemp);
        }
    }

    async HX204(IdsNo, actualProtocol) {
        var objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsNo);
        var start_weight = actualProtocol.includes("Start Weight");

        if (start_weight == true) {

            let objLodData = globalData.arrLodData.find(LD => LD.idsNo == IdsNo);
            objLodData.counter = objLodData.counter + 1;

            let arrToObj = objLodData.arr.reduce(((r, c) => Object.assign(r, c)), {})
            var mod = arrToObj["Modal"]
            let startWeight;

            if (mod == "HX204") {

                if (objLodData.counter == 2) {
                    let value = actualProtocol.split('Weight')[1].trim()
                    let Weight = value.split(" ")[0];
                    startWeight = { 'iniWt': Weight, 'flag': true, 'type': mod };
                    objLodData.arr.push(startWeight);
                    objLodData.counter = 0
                }
            }


            // let value = actualProtocol.split('Weight')[1].trim()
            // let Weight = value.split(" ")[0];
            // startWeight = { 'iniWt': Weight, 'flag': true, 'type': mod };
            // objLodData.arr.push(startWeight);
            // objLodData.counter = 0




        }

        var dry_weight = actualProtocol.includes("Dry Weight");
        if (dry_weight == true) {
            let value = actualProtocol.split('Weight')[1].trim()
            let Weight = value.split(" ")[0];
            let dryWeight = { 'finalWt': Weight, 'flag': true };
            objLodData.arr.push(dryWeight);

        }

        var drying_Temp = actualProtocol.includes("Drying Temp");
        if (drying_Temp == true) {
            let temp = actualProtocol.split('Temp')[1].trim()
            let temperature = temp.split(" ")[0];
            let dryTemp = { 'setTemp': temperature, 'flag': true };
            objLodData.arr.push(dryTemp);
        }
    }

    /***************************************************************************/

    async insertFriabilityOnBal(IdsNo, protocol) {
        try {
            let now = new Date();
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var objFriBal = globalData.FrabilityOnBal.find(k => k.idsNo == IdsNo);
            var tempLimits = globalData.arr_limits.find(k => k.idsNo == IdsNo);
            // var objInvalid = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
            var productObj = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo);
            var rwtAfterTest, rwtBeforeTest, nwtAfterTest, nwtBeforeTest, lwtAfterTest, lwtBeforeTest, decimalPoint;
            var selectedIds;
            var ActualRPM = "";
            var ActualCount = ""
            var intervalFound;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var actualProtocol = protocol;
            var tempCubic = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var CurrentCubic = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            // var tdValue = actualProtocol.substring(0, 5);//starting 
            // var recPrtotocol = actualProtocol.substring(7).trim().split(" ");
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            let retuRes = await fetchDetails.checkFriabilityStatus(IdsNo);
            if (retuRes.status == 'before') {
                if (tempCubic.Sys_RotaryType == 'Double') {
                    lwtBeforeTest = objFriBal.dataValue1;
                    rwtBeforeTest = objFriBal.dataValue2;
                    nwtBeforeTest = 0;
                    decimalPoint = await calculateDp.precision(objFriBal.dataValue1)
                } else {
                    lwtBeforeTest = 0;
                    rwtBeforeTest = 0;
                    nwtBeforeTest = objFriBal.dataValue1;
                    decimalPoint = await calculateDp.precision(objFriBal.dataValue1)
                }
                var res = await proObj.productData(tempCubic)
                const checkData = {
                    str_tableName: 'tbl_tab_friability',
                    data: 'MAX(MstSerNo) AS SeqNo',
                    condition: [
                        { str_colName: 'BFGCode', value: tempCubic.Sys_BFGCode, comp: 'eq' },
                        { str_colName: 'ProductName', value: tempCubic.Sys_ProductName, comp: 'eq' },
                        { str_colName: 'PVersion', value: tempCubic.Sys_PVersion, comp: 'eq' },
                        { str_colName: 'Version', value: tempCubic.Sys_Version, comp: 'eq' },
                        { str_colName: 'BatchNo', value: tempCubic.Sys_Batch, comp: 'eq' },
                        { str_colName: 'IdsNo', value: selectedIds, comp: 'eq' },
                        { str_colName: 'CubicleType', value: tempCubic.Sys_CubType, comp: 'eq' },//added by vivek on 03/04/2020
                        { str_colName: 'RepoLabel10', value: tempCubic.Sys_IPQCType, comp: 'eq' },//added by vivek on 03/04/2020
                    ]
                }
                var result = await database.select(checkData);
                var intMstSerNo;
                if (result[0][0].SeqNo == null) {
                    intMstSerNo = 1;
                } else {
                    var newMstSerNo = result[0][0].SeqNo + 1;
                    intMstSerNo = newMstSerNo;
                }
                var saveFriData = {
                    str_tableName: 'tbl_tab_friability',
                    data: [
                        { str_colName: 'MstSerNo', value: serverConfig.ProjectName == 'MLVeer' ? 1 : intMstSerNo },
                        { str_colName: 'InstruId', value: 0 },
                        { str_colName: 'BFGCode', value: tempCubic.Sys_BFGCode },
                        { str_colName: 'ProductName', value: tempCubic.Sys_ProductName },
                        { str_colName: 'ProductType', value: productObj.productType },
                        { str_colName: 'IdsNo', value: selectedIds },
                        { str_colName: 'CubicalNo', value: tempCubic.Sys_CubicNo },
                        { str_colName: 'CubicleName', value: tempCubic.Sys_CubicName },
                        { str_colName: 'CubicleLocation', value: tempCubic.Sys_dept },
                        { str_colName: 'BatchNo', value: tempCubic.Sys_Batch },
                        //{ str_colName: 'NoOfSample', value: productObj.Sys_Batch },
                        { str_colName: 'UserId', value: tempUserObject.UserId },
                        { str_colName: 'UserName', value: tempUserObject.UserName },
                        { str_colName: 'PrDate', value: date.format(now, 'YYYY-MM-DD') },
                        { str_colName: 'PrTime', value: date.format(now, 'HH:mm:ss') },
                        { str_colName: 'Side', value: tempCubic.Sys_RotaryType },
                        { str_colName: 'Unit', value: 'g' },
                        { str_colName: 'DecimalPoint', value: decimalPoint },
                        { str_colName: 'WgmtModeNo', value: 8 },
                        { str_colName: 'FriNMTLimit', value: parseFloat(res[1].Param8_Nom) },
                        { str_colName: 'SetCount', value: parseFloat(res[1].Param8_T1Neg) },
                        { str_colName: 'SetRPM', value: parseFloat(res[1].Param8_T1Pos) },
                        { str_colName: 'FriabilityQty', value: tempLimits.Friability.noOfSamples },
                        { str_colName: 'CubicleType', value: tempCubic.Sys_CubType },
                        { str_colName: 'RepoLabel10', value: tempCubic.Sys_IPQCType }, // added by vivek on 03-04-2020
                        { str_colName: 'ReportType', value: tempCubic.Sys_RptType },
                        { str_colName: 'MachineCode', value: tempCubic.Sys_MachineCode },
                        { str_colName: 'MFGCode', value: tempCubic.Sys_MfgCode },
                        { str_colName: 'BatchSize', value: `${tempCubic.Sys_BatchSize} ${tempCubic.Sys_BatchSizeUnit}` },
                        { str_colName: 'FriabilityID', value: 'NA' },
                        { str_colName: 'NWtBeforeTest', value: nwtBeforeTest },
                        // { str_colName: 'NWtAfterTest', value: nwtAfterTest },
                        { str_colName: 'LWtBeforeTest', value: lwtBeforeTest },
                        // { str_colName: 'LWtAfterTest', value: lwtAfterTest },
                        //{ str_colName: 'RHSSrNo', value: productObj.CubicleType },
                        { str_colName: 'RWtBeforeTest', value: rwtBeforeTest },
                        // { str_colName: 'RWtAfterTest', value: rwtAfterTest },
                        { str_colName: 'PrintNo', value: 0 },
                        { str_colName: 'IsArchived', value: 0 },
                        //{ str_colName: 'BatchComplete', value: date.format(now, 'HH:mm:ss') },
                        //{ str_colName: 'GraphType', value: productObj.HardnessID },
                        { str_colName: 'BalanceId', value: CurrentCubic.Sys_BalID },
                        { str_colName: 'PVersion', value: tempCubic.Sys_PVersion },
                        { str_colName: 'Version', value: tempCubic.Sys_Version },
                        //{ str_colName: 'CheckedByID', value: productObj.RepoLabel11 },
                        //{ str_colName: 'CheckedByName', value: productObj.Sys_BalID },
                        //{ str_colName: 'CheckedByDate', value: productObj.RepoLabel13 },
                        //{ str_colName: 'Stage', value: productObj.PrintNo },
                        { str_colName: 'BRepSerNo', value: 0 },
                        { str_colName: 'RepoLabel11', value: tempCubic.Sys_Validation },
                        { str_colName: 'Lot', value: objLotData.LotNo },
                        // { str_colName: 'ActualCount', value: parseFloat(res[1].Param8_T1Neg) },
                        // { str_colName: 'ActualRPM', value: parseFloat(res[1].Param8_T1Pos) },
                        { str_colName: 'Area', value: tempCubic.Sys_Area },
                        { str_colName: 'AppearanceDesc', value: tempCubic.Sys_Appearance },
                        { str_colName: 'MachineSpeed_Min', value: tempCubic.Sys_MachineSpeed_Min },
                        { str_colName: 'MachineSpeed_Max', value: tempCubic.Sys_MachineSpeed_Max },
                        { str_colName: 'GenericName', value: tempCubic.Sys_GenericName },
                        { str_colName: 'BMRNo', value: tempCubic.Sys_BMRNo },


                    ]
                }
                //console.log(saveFriData);
                await database.save(saveFriData);

                var objUpdateValidation = {
                    str_tableName: "tbl_cubical",
                    data: [
                        { str_colName: 'Sys_Validation', value: 0 },
                    ],
                    condition: [
                        { str_colName: 'Sys_IDSNo', value: IdsNo },
                    ]
                }
                await database.update(objUpdateValidation);
                objMonitor.monit({ case: 'FRIFINWT', idsNo: IdsNo, data: { test: 'FRIABILITY' } });
                // As soon as Before weight is taken the we have to hide menu for specific time
                var objActivity = {};
                Object.assign(objActivity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                    { activity: 'Friability Weighment Started on IDS' + IdsNo });
                await objActivityLog.ActivityLogEntry(objActivity)
                // Instrument usage for Friability completed
                if (serverConfig.friabilityType == 'BFBO' || serverConfig.friabilityType == 'BFBT') {
                    var selectedIds;
                    var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
                    if (IPQCObject != undefined) {
                        selectedIds = IPQCObject.selectedIds;
                    } else {
                        selectedIds = IdsNo;
                    }
                    var tempBFBO = globalData.arrBFBO.find(k => k.idsNo == selectedIds);
                    tempBFBO.before = true;
                }
                await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', 'Friability Weighment', 'started')
                await fetchDetails.updateFriabilityTime(IdsNo, tempLimits);
                return true;
            } else {
                if (tempCubic.Sys_RotaryType == 'Double') {
                    lwtAfterTest = objFriBal.dataValue1;
                    rwtAfterTest = objFriBal.dataValue2;
                    nwtAfterTest = 0;

                } else {
                    lwtAfterTest = 0;
                    rwtAfterTest = 0;
                    nwtAfterTest = objFriBal.dataValue1;

                }
                var updateFriability = {
                    str_tableName: 'tbl_tab_friability',
                    data: [
                        { str_colName: 'NWtAfterTest', value: nwtAfterTest },
                        { str_colName: 'LWtAfterTest', value: lwtAfterTest },
                        { str_colName: 'RWtAfterTest', value: rwtAfterTest },
                        { str_colName: 'PrEndDate', value: date.format(new Date(), 'YYYY-MM-DD') },
                        { str_colName: 'PrEndTime', value: date.format(new Date(), 'HH:mm:ss') },
                    ],
                    condition: [
                        { str_colName: 'RepSerNo', value: retuRes.sqNo },
                    ]
                }
                await database.update(updateFriability);
                if (serverConfig.friabilityType == 'BFBO' || serverConfig.friabilityType == 'BFBT') {
                    var selectedIds;
                    var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
                    if (IPQCObject != undefined) {
                        selectedIds = IPQCObject.selectedIds;
                    } else {
                        selectedIds = IdsNo;
                    }
                    var tempBFBO = globalData.arrBFBO.find(k => k.idsNo == selectedIds);
                    tempBFBO.before = false;
                    tempBFBO.setParam = false;
                    tempBFBO.after = false;
                }
                // Selecting the value from friability
                var selectObj = {
                    str_tableName: 'tbl_tab_friability',
                    data: '*',
                    condition: [
                        { str_colName: 'RepSerNo', value: retuRes.sqNo },
                    ]
                }
                if (serverConfig.ProjectName == 'MLVeer') {
                    // Added for only MLVERR on 30/05/2020
                    var SPresu = await objSP.PercentageCalculationForFriability(retuRes.sqNo);
                }
                let friabilityInfo = await database.select(selectObj);
                let batchSummaryObject = {
                    BFGCode: tempCubic.Sys_BFGCode,
                    ProductName: tempCubic.Sys_ProductName,
                    PVersion: tempCubic.Sys_PVersion,
                    Version: tempCubic.Sys_Version,
                    PrdType: 1,
                    CubType: tempCubic.Sys_CubType,
                    BatchNo: tempCubic.Sys_Batch,
                    Unit: 'g',
                    Side: tempCubic.Sys_RotaryType,
                    InstrumentID: CurrentCubic.Sys_BalID,
                    UserId: tempUserObject.UserId,
                    UserName: tempUserObject.UserName,
                    nwtBeforeTestF: friabilityInfo[0][0].NWtBeforeTest,
                    nwtAfterTestF: friabilityInfo[0][0].NWtAfterTest,
                    lwtBeforeTestF: friabilityInfo[0][0].LWtBeforeTest,
                    lwtAfterTestF: friabilityInfo[0][0].LWtAfterTest,
                    rwtBeforeTestF: friabilityInfo[0][0].RWtBeforeTest,
                    rwtAfterTestF: friabilityInfo[0][0].RWtAfterTest,
                    Dept: tempCubic.Sys_dept,
                    Nom: friabilityInfo[0][0].FriNMTLimit,
                    PrTime: date.format(now, 'HH:mm:ss'),
                    PrDate: date.format(now, 'YYYY-MM-DD'),
                    ReportType: 0,
                    DP: friabilityInfo[0][0].DecimalPoint
                }
                var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                if (!(currentCubicle.Sys_IPQCType == 'Compression' && currentCubicle.Sys_Area == "Coating")) {


                    await objBatchSummary.saveBatchSummaryFriability(batchSummaryObject, IdsNo);
                }

                var objActivity = {};
                Object.assign(objActivity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                    { activity: 'Friability Weighment Completed on IDS' + IdsNo });
                await objActivityLog.ActivityLogEntry(objActivity);
                objMonitor.monit({ case: 'BL', idsNo: IdsNo, data: { test: 'FRIABILATOR', flag: 'COMPLETED' } });
                // Instrument usage for Friability completed
                await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', '', 'completed')
                var response = await objSP.getRemarkForFriability(retuRes.sqNo);
                //Online printing
                const objIOnlinePrint = new IOnlinePrint();
                objIOnlinePrint.RepSerNo = retuRes.sqNo;


                const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
                if (objPrinterName.Sys_PrinterName != 'NA' && globalData.arrsAllParameters[0].tbl_PrintingMode == 'Auto') {
                    objIOnlinePrint.testType = "Regular";
                    objIOnlinePrint.reportOption = "Friabilator";
                    objIOnlinePrint.userId = tempUserObject.UserId;
                    objIOnlinePrint.username = tempUserObject.UserName;
                    objIOnlinePrint.idsNo = IdsNo
                    // const objPrinterName = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);



                    const Activity = {};
                    Object.assign(Activity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'IDS ' + IdsNo + 'Auto Print initiated' });
                    await objActivityLog.ActivityLogEntry(Activity);


                    await objPrintReport.generateOnlineReport(objIOnlinePrint, objPrinterName.Sys_PrinterName);
                }
                return response;
            }
        } catch (error) {
            console.log(error)
            return error;
        }
    }


    async clearHardnesVariable(IdsNo) {
        let objHardness = globalData.arrHardnessMT50.find(ht => ht.idsNo == IdsNo);
        let objarrHardnessMT50Reading = globalData.arrHardnessMT50Reading.find(ht => ht.idsNo == IdsNo);
        objHardness.sampleNo = 0,
            objHardness.HardnessVal = [],
            objHardness.HardnessDecimal = 0,
            objHardness.HardnessNom = 0,
            objHardness.Hardnessrneg = 0,
            objHardness.Hardnesspos = 0

        objarrHardnessMT50Reading.Readingflag = false,
            objarrHardnessMT50Reading.RhCounter = 0,
            objarrHardnessMT50Reading.SampleSkipped = false,
            objarrHardnessMT50Reading.atPresent = false,
            objarrHardnessMT50Reading.sampleFromString = 0,
            objarrHardnessMT50Reading.localSampleCounter = 0
    }

    /**
    * 
    * @param {*} IdsNo 
    * @param {*} protocol 
    * @description Abandon function
    */
    insertBulkWeighmentHardness_8M(IdsNo, protocol) {
        try {
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var objLotData = globalData.arrLot.find(k => k.idsNo == IdsNo);
            var selectedIds;
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var currentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo)
            // var actualProtocol = protocol;
            var tempHardVal = 0;
            let now = new Date();
            var protocolValue = protocol.substring(0, 5);// starting 5 character
            var protocolValueData = protocol.substring(5);// starting 5 character
            var protocolIncomingType = protocolValue.substring(0, 1);//Check incoming Protocol is from "T" or "H"
            //var hardnessReading = protocol.substring(0, 7);
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var objHardness = globalData.arrHardness425.find(ht => ht.idsNo == IdsNo);
            var productlimits = globalData.arr_limits.find(al => al.idsNo == IdsNo);

            var includeHardness = protocolValueData.includes('Hardness');

            if (includeHardness == true) {
                var recordHardness = true;
            }

            if (recordHardness == true) {
                var includesMeasurements = protocolValueData.includes('Measurements');
                if (includesMeasurements == true) {

                }
            }
        } catch (err) {

        }

    }
    async sendProtocolTOUDP(str_Protocol, str_IpAddress) {
        // encrypting text
        //console.log('4');
        var encryptedProtocol
        if (str_Protocol != "+") {
            encryptedProtocol = await objEncryptDecrypt.encrypt(str_Protocol);
        }
        else {
            encryptedProtocol = str_Protocol;
        }

        // calculating checksum for enc protocol and appending to protocol
        var arrEncryptProtocol = [];
        arrEncryptProtocol.push(...Buffer.from(encryptedProtocol, 'utf8'));
        let protocolWithCheckum = await objCheckSum.getCheckSumBuffer(arrEncryptProtocol);
        // finally send protocol to requested Ids
        objServer.server.send(protocolWithCheckum, 8080, str_IpAddress, function (error) {
            if (error) {
                console.log('new error on protocolHandlerController', error)
            } else {
                var logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , (SENT)From PC : To  " + str_IpAddress + " : " + str_Protocol;
                console.log(logQ);
                //commented by vivek on 31-07-2020********************************
                //logFromPC.info(logQ);
                //logFromPC.addtoProtocolLog(logQ)
                //************************************************************** */
                if (str_Protocol != 'DM0G0Group Weighment, Pending,,,,') {
                    // objClsLogger.protocolLogFromPC(str_Protocol,str_IpAddress);
                    // console.log('Protocol sent ' + str_Protocol + "ip" + str_IpAddress);
                    objProtocolStore.storeresponse(str_IpAddress.split('.')[3], str_Protocol, str_IpAddress);
                }
            }

        });
    }

    async ISInvalid(Value, IdsNo) {
        var flag;
        let tempTDObj = globalData.arrTDTData.find(td => td.idsNo == IdsNo);
        if (isNaN(parseInt(Value))) {

            var InvalidOb = { "INVALID": 0 };
            tempTDObj.arr.push(InvalidOb);
            flag = true;
            //invalid String
        }
        else {
            flag = false;
        }
        console.log(flag);
        return flag;

    }

    async insertBalanceString(IdsNo, protocol) {   // for particle size handle 
        try {
            var tdValue = protocol.substring(0, 5);
            var data = globalData.arrPaticleData.find(k => k.idsNo == IdsNo);
            var selectedIds;
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            var protocolIncomingType = protocol.substring(0, 1);
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var tempLimObj = globalData.arr_limits.find(k => k.idsNo == IdsNo);
            var typeValue = "P";
            var actualSampleValue = data.actualSampleValue;


            if (tdValue != "HD000" && tdValue != "TD000") {
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }
                var date = protocol.includes("Date")
                if (date) {
                    data.datecount = true
                }
                var times = protocol.includes("Time")

                if (times) {
                    data.timecount = true
                }
                if (data.datecount == true && data.timecount == true) {
                    if (protocol.includes("gm") || protocol.includes("Gm") || protocol.includes("GM") || protocol.includes("kg") || protocol.includes("Kg") || protocol.includes("KG") || protocol.includes("g") || protocol.includes("G")) {
                        var actualWt = protocol.replace(/[\sNRrn]+/g, "|")
                        actualWt = actualWt.split("|");
                        if (actualWt.length != 0 && !isNaN(Number(actualWt[1]))) {
                            var weightValue = actualWt[1];
                            var unit = actualWt[2];
                            data.dataValues = weightValue
                            data.side = "N"
                            data.unit = unit

                        }
                        /// particle size
                        var intNos, maxLimit, minLimit;
                        var objActivity = {}
                        if (data.actualSampleValue == 1) {
                            await clspowerbackup.insertPowerBackupData(cubicalObj, typeValue, tempUserObject, IdsNo);
                            Object.assign(objActivity,
                                { strUserId: tempUserObject.UserId },
                                { strUserName: tempUserObject.UserName },
                                { activity: 'Particle Seizing Weighment Started on IDS' + IdsNo });
                            await objActivityLog.ActivityLogEntry(objActivity);
                            // Instrument Usage log for balance start
                            await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', 'Particle Seizing', 'started');
                            await objRemarkInComplete.updateEntry(IdsNo, 'P');
                        }
                    }
                }

                return tdValue;
            } else {
                var tempTDHD = globalData.arrTHHDrepet.find((k) => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                console.log(tempTDHD);
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    var tempParticledata = globalData.arrPaticleData.find(k => k.idsNo == IdsNo);
                    if (tempParticledata.datecount == false || tempParticledata.timecount == false || tempParticledata.dataValues == undefined) {
                        if (tempParticledata == undefined) {
                            globalData.arrPaticleData.push({ idsNo: IdsNo, actualSampleValue: 1 });
                        } else {
                            tempParticledata.datecount = false;
                            tempParticledata.timecount = false;
                            tempParticledata.dataValues = undefined;
                            // tempParticledata.actualSampleValue = 0;
                            tempParticledata.unit = undefined;
                            tempParticledata.side = undefined;

                        }
                        return `${protocolIncomingType}R40Invalid String,,,,`;
                    }

                    var particleSeizingMeshObj = {}  // initializing mesh obj for particle test
                    var currentParticleSeizing = globalData.arrparticleSizingCurrentTest.find((k) => k.idsNo == IdsNo);

                    if (typeValue == 'P') {
                        intNos = currentParticleSeizing.particleSeizing.length + 1
                    }
                    let testFlag


                    intNos = tempLimObj.PartSize.noOfSamples;
                    // maxLimit = tempLimObj.PartSize.T1Pos;
                    // minLimit = tempLimObj.PartSize.T1Neg;
                    // actualSampleValue = data.actualSampleValue;
                    if (actualSampleValue <= intNos) {
                        let currentParticleSeizingTest;

                        currentParticleSeizingTest = currentParticleSeizing.particleSeizing;

                        if (actualSampleValue != 1) {

                            for (let i = 0; i < currentParticleSeizingTest.length; i++) {
                                if (currentParticleSeizingTest[i].isCompleted === 'Pending') {
                                    currentParticleSeizingTest[i].isCompleted = 'Completed';

                                    particleSeizingMeshObj['Pparam'] = `Param${currentParticleSeizingTest[i].paramIndex}_Upp`;
                                    particleSeizingMeshObj['Nparam'] = `Param${currentParticleSeizingTest[i].paramIndex}_Low`;

                                    if (currentParticleSeizingTest[i].flag === 'a') {   // a for above
                                        particleSeizingMeshObj['testFlag'] = `Above ${currentParticleSeizingTest[i].mesh} Mesh`;
                                    } else if (currentParticleSeizingTest[i].flag === 'b') {    // b for below
                                        particleSeizingMeshObj['testFlag'] = `Below ${currentParticleSeizingTest[i].mesh} Mesh`;

                                    }
                                    // continue;
                                } else if (currentParticleSeizingTest[i].isCompleted === 'NotCompleted') {
                                    testFlag = currentParticleSeizingTest[i].flag + currentParticleSeizingTest[i].mesh;
                                    currentParticleSeizingTest[i].isCompleted = 'Pending';
                                    break;
                                }
                            }


                            // await objIncompleteGran.saveIncompleteData(cubicalObj, data, intNos, typeValue, tempUserObject, IdsNo);
                            await objIncompleteGran.saveIncompleteData(cubicalObj, data, actualSampleValue, intNos, typeValue, tempUserObject, IdsNo);
                            objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' } })
                            var particleMenu = globalData.arr_limits.find(k => k.idsNo == IdsNo);
                            data.actualSampleValue = actualSampleValue + 1;
                            let count = actualSampleValue + 1;
                            let message;
                            switch (testFlag) {
                                // case 'b60':
                                //     message = "BELOW 60 MESH";
                                //     break;
                                case 'a20':
                                    message = "ABOVE 20 MESH";
                                    break;
                                case 'a40':
                                    message = "ABOVE 40 MESH";
                                    break;
                                case 'a60':
                                    message = "ABOVE 60 MESH";
                                    break;
                                case 'a80':
                                    message = "ABOVE 80 MESH";
                                    break;
                                case 'a100':
                                    message = "ABOVE 100 MESH";
                                    break;
                                case 'b100':
                                    message = "BELOW 100 MESH";
                                    break;
                                default:
                                    message = "";
                                    break;
                            }
                            await objCheckGran.checkGranulation(cubicalObj, typeValue, data, IdsNo);

                            // let sendProtocol = `WPP00${count}${message},`;
                            let sendProtocol = `DL03${message},`;
                            tempParticledata.datecount = false;
                            tempParticledata.timecount = false;
                            tempParticledata.dataValues = undefined;
                            tempParticledata.unit = undefined;
                            tempParticledata.sampleNo = 0;
                            tempParticledata.message = ""
                            // let sendProtocol = `HR0`;
                            return sendProtocol;
                        }
                        else {
                            await objIncompleteGran.saveIncompleteData(cubicalObj, data, actualSampleValue, intNos, typeValue, tempUserObject, IdsNo);
                            data.actualSampleValue = actualSampleValue + 1;
                            let count = actualSampleValue + 1;
                            let testFlag;
                            let message;

                            for (let i = 0; i < currentParticleSeizingTest.length; i++) {
                                if (currentParticleSeizingTest[i].isCompleted === 'NotCompleted') {
                                    testFlag = currentParticleSeizingTest[i].flag + currentParticleSeizingTest[i].mesh;
                                    currentParticleSeizingTest[i].isCompleted = 'Pending';
                                    break;
                                }
                            }

                            objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' } })
                            switch (testFlag) {
                                case "aTestSample":
                                    message = "TEST SAMPLE";
                                    break;
                                // case 'b60':
                                //     message = "BELOW 60 MESH";
                                //     break;
                                case 'a20':
                                    message = "ABOVE 20 MESH";
                                    break;
                                case 'a40':
                                    message = "ABOVE 40 MESH";
                                    break;
                                case 'a60':
                                    message = "ABOVE 60 MESH";
                                    break;
                                case 'a80':
                                    message = "ABOVE 80 MESH";
                                    break;
                                case 'a100':
                                    message = "ABOVE 100 MESH";
                                    break;
                                case 'b100':
                                    message = "BELOW 100 MESH";
                                    break;
                                default:
                                    message = "";
                                    break;
                            }
                            //let sendProtocol = `WPP00${count}${message},`;
                            let sendProtocol = `DL03${message},`;
                            if (actualSampleValue != 8) {
                                let sendProtocol = `DL03${message},`;
                                tempParticledata.datecount = false;
                                tempParticledata.timecount = false;
                                tempParticledata.dataValues = undefined;
                                tempParticledata.unit = undefined;
                                tempParticledata.sampleNo = 0;
                                tempParticledata.message = ""

                                return sendProtocol;
                            }

                        }

                    } else {
                        let sendProtocol = `DL03,`;
                        return sendProtocol;
                    }
                } else {
                    console.log("REPEAT_COUNT FOR TDHD000");
                    return "+";
                }

            }


        } catch (err) {
            var tempParticledata = globalData.arrPaticleData.find(k => k.idsNo == IdsNo);
            if (tempParticledata == undefined) {
                globalData.arrPaticleData.push({ idsNo: IdsNo, actualSampleValue: 1 });
            } else {
                tempParticledata.datecount = false;
                tempParticledata.timecount = false;
                tempParticledata.dataValues = undefined;
                tempParticledata.actualSampleValue = 1;
                tempParticledata.unit = undefined;
                tempParticledata.side = undefined
                tempParticledata.sampleNo = 0;
                tempParticledata.message = ""

            }
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log(err);
            throw new Error(err);
        }
    }

    async insertBalanceStringFine(IdsNo, protocol) {   // for %Fine size handle 
        try {
            var tdValue = protocol.substring(0, 5);
            var data = globalData.arrpercentFineData.find(k => k.idsNo == IdsNo);
            var selectedIds;
            var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
            if (IPQCObject != undefined) {
                selectedIds = IPQCObject.selectedIds;
            } else {
                selectedIds = IdsNo;
            }
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
            var tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            var tempLimObj = globalData.arr_limits.find(k => k.idsNo == IdsNo);
            var protocolIncomingType = protocol.substring(0, 1);
            var typeValue = "F";
            var actualSampleValue = data.actualSampleValue;
            if (tdValue != "HD000" && tdValue != "TD000") {
                var tempTDHD = globalData.arrTHHDrepet.find(k => k.idsNo == IdsNo);
                if (tempTDHD == undefined) { globalData.arrTHHDrepet.push({ idsNo: IdsNo, flag: false, oc: 0 }) }
                else { tempTDHD.flag = false; tempTDHD.oc = 0 }
                var date = protocol.includes("Date")
                if (date) {
                    data.datecount = true
                }
                var times = protocol.includes("Time")

                if (times) {
                    data.timecount = true
                }
                if (data.datecount == true && data.timecount == true) {
                    if (protocol.includes("gm") || protocol.includes("Gm") || protocol.includes("GM") || protocol.includes("kg") || protocol.includes("Kg") || protocol.includes("KG") || protocol.includes("g") || protocol.includes("G")) {
                        var actualWt = protocol.replace(/[\sNRrn]+/g, "|")
                        actualWt = actualWt.split("|");
                        if (actualWt.length != 0 && !isNaN(Number(actualWt[1]))) {
                            var weightValue = actualWt[1]
                            var side = actualWt[2].substring(actualWt[2].length - 1, 1);
                            var unit = actualWt[2];
                            data.dataValues = weightValue
                            data.side = "N"
                            data.unit = unit
                        }
                        /// particle size
                        var intNos, maxLimit, minLimit;
                        var objActivity = {}
                        if (data.actualSampleValue == 1) {
                            await clspowerbackup.insertPowerBackupData(cubicalObj, typeValue, tempUserObject, IdsNo);
                            Object.assign(objActivity,
                                { strUserId: tempUserObject.UserId },
                                { strUserName: tempUserObject.UserName },
                                { activity: 'Particle Seizing Weighment Started on IDS' + IdsNo });
                            await objActivityLog.ActivityLogEntry(objActivity);
                            // Instrument Usage log for balance start
                            await objInstrumentUsage.InstrumentUsage('Balance', IdsNo, 'tbl_instrumentlog_balance', 'Particle Seizing', 'started');
                            await objRemarkInComplete.updateEntry(IdsNo, 'F');
                        }
                    }
                }

                return tdValue;
            } else {
                var tempTDHD = globalData.arrTHHDrepet.find((k) => k.idsNo == IdsNo);
                tempTDHD.flag = true;
                tempTDHD.oc = tempTDHD.oc + 1;
                /************************************************************* */
                console.log(tempTDHD);
                if (tempTDHD.flag == true && tempTDHD.oc == 1) {
                    var tempFineData = globalData.arrpercentFineData.find(k => k.idsNo == IdsNo);
                    if (tempFineData.datecount == false || tempFineData.timecount == false || tempFineData.dataValues == undefined) {
                        if (tempFineData == undefined) {
                            globalData.arrpercentFineData.push({ idsNo: IdsNo, actualSampleValue: 1 });
                        } else {
                            tempFineData.datecount = false;
                            tempFineData.timecount = false;
                            tempFineData.dataValues = undefined;
                            // tempFineData.actualSampleValue = 0;
                            tempFineData.unit = undefined;
                            tempFineData.side = undefined;

                        }
                        return `${protocolIncomingType}R40Invalid String,,,,`;
                    }


                    var perFineMeshObj = {}  // initializing mesh obj for particle test
                    var PerFineSelected = globalData.arrPerFineCurrentTest.find(k => k.idsNo == IdsNo);
                    var currentPerFine = globalData.arrPerFineTypeSelectedMenu.find(k => k.idsNo == IdsNo);



                    let testFlag
                    intNos = tempLimObj.PerFine.noOfSamples;
                    if (actualSampleValue <= intNos) {
                        let currentPerFineTest;
                        var selectTest = currentPerFine.selectedPerFine
                        currentPerFineTest = PerFineSelected[selectTest];

                        if (actualSampleValue != 1) {
                            for (let i = 0; i < currentPerFineTest.length; i++) {
                                if (currentPerFineTest[i].isCompleted === 'Pending') {
                                    currentPerFineTest[i].isCompleted = 'Completed';

                                    perFineMeshObj['Pparam'] = `Param${currentPerFineTest[i].paramIndex}_Upp`;
                                    perFineMeshObj['Nparam'] = `Param${currentPerFineTest[i].paramIndex}_Low`;

                                    if (currentPerFineTest[i].flag === 'a') {   // a for above
                                        perFineMeshObj['testFlag'] = `Above ${currentPerFineTest[i].mesh} Mesh`;
                                    } else if (currentPerFineTest[i].flag === 'b') {    // b for below
                                        perFineMeshObj['testFlag'] = `Below ${currentPerFineTest[i].mesh} Mesh`;

                                    }
                                    // continue;
                                } else if (currentPerFineTest[i].isCompleted === 'NotCompleted') {
                                    testFlag = currentPerFineTest[i].flag + currentPerFineTest[i].mesh;
                                    currentPerFineTest[i].isCompleted = 'Pending';
                                    break;
                                }
                            }

                            // await objIncompleteGran.saveIncompleteData(cubicalObj, data, intNos, typeValue, tempUserObject, IdsNo);
                            await objIncompleteGran.saveIncompleteData(cubicalObj, data, actualSampleValue, intNos, typeValue, tempUserObject, IdsNo);
                            objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' } })
                            data.actualSampleValue = actualSampleValue + 1;
                            let count = actualSampleValue + 1;
                            let message;
                            switch (testFlag) {
                                case 'b60':
                                    message = "BELOW 60 MESH";
                                    break;
                                default:
                                    message = "";
                                    break;
                            }
                            await objCheckGran.checkGranulation(cubicalObj, typeValue, data, IdsNo);

                            // let sendProtocol = `WPP00${count}${message},`;

                            let sendProtocol = `DL03${message},`;
                            tempFineData.datecount = false;
                            tempFineData.timecount = false;
                            tempFineData.dataValues = undefined;
                            tempFineData.unit = undefined;
                            tempFineData.sampleNo = 0;
                            tempFineData.message = ""

                            return sendProtocol;
                        }
                        else {
                            await objIncompleteGran.saveIncompleteData(cubicalObj, data, actualSampleValue, intNos, typeValue, tempUserObject, IdsNo);

                            data.actualSampleValue = actualSampleValue + 1;
                            let count = actualSampleValue + 1;
                            let message;

                            for (let i = 0; i < currentPerFineTest.length; i++) {
                                if (currentPerFineTest[i].isCompleted === 'NotCompleted') {
                                    testFlag = currentPerFineTest[i].flag + currentPerFineTest[i].mesh;
                                    currentPerFineTest[i].isCompleted = 'Pending';
                                    break;
                                }
                            }
                            objMonitor.monit({ case: 'WT', idsNo: IdsNo, data: { weight: weightValue, flag: 'in' } })
                            switch (testFlag) {
                                case "aTestSample":
                                    message = "TEST SAMPLE";
                                    break;
                                case 'b60':
                                    message = "BELOW 60 MESH";
                                    break;
                                default:
                                    message = "";
                                    break;
                            }
                            //let sendProtocol = `WPP00${count}${message},`;
                            let sendProtocol = `DL03${message},`;
                            if (actualSampleValue != 3) {
                                tempFineData.datecount = false;
                                tempFineData.timecount = false;
                                tempFineData.dataValues = undefined;
                                tempFineData.unit = undefined;
                                tempFineData.sampleNo = 0;
                                tempFineData.message = ""

                                return sendProtocol;
                            }

                        }

                    } else {
                        let sendProtocol = `DL03,`;
                        return sendProtocol;
                    }
                } else {
                    console.log("REPEAT_COUNT FOR TDHD000");
                    return "+";
                }

            }
        } catch (err) {
            var tempFinedata = globalData.arrpercentFineData.find(k => k.idsNo == IdsNo);
            if (tempFinedata == undefined) {
                globalData.arrpercentFineData.push({ idsNo: IdsNo, actualSampleValue: 0 });
            } else {
                tempFinedata.datecount = false;
                tempFinedata.timecount = false;
                tempFinedata.dataValues = undefined;
                tempFinedata.actualSampleValue = 1;
                tempFinedata.unit = undefined;
                tempFinedata.side = undefined

            }
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            //commented by vivek on 31-07-2020*********************************** */
            //ErrorLog.error(logError);
            ErrorLog.addToErrorLog(logError);
            //******************************************************************* */
            console.log(err);
            throw new Error(err);
        }
    }

}
module.exports = BulkWeighment;

