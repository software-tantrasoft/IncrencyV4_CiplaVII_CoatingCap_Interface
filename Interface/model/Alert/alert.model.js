const Database = require('../../database/clsQueryProcess');
const database = new Database();
const globalData = require('../../global/globalData');
const serverConfig = require('../../global/severConfig');
const moment = require('moment');
const date1 = require('date-and-time');
const clsprotocolHandler = require('../../controller/protocolHandlerController');
const clsPreWeighmentCheck = require('../clsPreWeighmentChecks');
const protocolHandler = new clsprotocolHandler();
var objPreWeighmentCheck = new clsPreWeighmentCheck();

class AlertModel {
    constructor() { }
    /**
     * @description Given function will sow alert
     */
    async showAlertOld() {
      //  console.log('AlertArray', globalData.alertArrTemp);
        let alertArray = [];
        alertArray = globalData.alertArrTemp;
        var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
        if (alertArray.length > 0) {
            for (let i = 0; i < alertArray.length; i++) {
                // Here we are checking if calibration or weighment is in process
                let CalibORWeighmentObj = globalData.arr_FlagCallibWeighment.find(k => k.idsNo == alertArray[i].IDSNO);
                let blnCalibORWeigmntStart;
                if (CalibORWeighmentObj != undefined) {
                    blnCalibORWeigmntStart = CalibORWeighmentObj.alertFlag;
                } else {
                    blnCalibORWeigmntStart = false;
                }

                var objPreWeighmentCheck = new clsPreWeighmentCheck();
                var batchStartCheck = await objPreWeighmentCheck.checkBatchStart(alertArray[i].IDSNO);
                
                let now = new Date();
                let date = moment(alertArray[i].AlertTime, 'HH:mm:ss')
                    .add(alertArray[i].intGroupParam, 'minutes')
                    .format("HH:mm:ss");
                let currentTime = date1.format(now, 'HH:mm:ss');
                // console.log('after time',date, 'current Time',currentTime)
                let flag = parseInt(currentTime.replace(regExp, "$1$2$3")) > parseInt(date.replace(regExp, "$1$2$3"));
                // console.log(date,currentTime,flag);
                if (blnCalibORWeigmntStart != true && batchStartCheck === "Batch Started,") {
                    if (flag == true) {
                        let sendIp = serverConfig.strIpSeries + alertArray[i].IDSNO;
                        let protocol = 'DM0G0Group Weighment, Pending,,,,'
                        protocolHandler.sendProtocol(protocol, sendIp);
                    }
                }
            }
        }
    }

    
    async showAlert() {
        //  console.log('AlertArray', globalData.alertArrTemp);
        try {
        let alertArray = [];
        alertArray = globalData.alertArrTemp;
        var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
        if (alertArray.length > 0) {
            for (let i = 0; i < alertArray.length; i++) {
                // Here we are checking if calibration or weighment is in process
                let CalibORWeighmentObj = globalData.arr_FlagCallibWeighment.find(k => k.idsNo == alertArray[i].IDSNO);
                let blnCalibORWeigmntStart;
                if (CalibORWeighmentObj != undefined) {
                    blnCalibORWeigmntStart = CalibORWeighmentObj.alertFlag;
                } else {
                    blnCalibORWeigmntStart = false;
                }
                // var batchStartCheck = await objPreWeighmentCheck.checkBatchStart(alertArray[i].IDSNO);
                var query1 = `SELECT * FROM  tbl_cubical WHERE Sys_Batch='${alertArray[i].strBatch}' AND Sys_IDSNo = '${alertArray[i].IDSNO}' AND Sys_CubicNo = ${alertArray[i].intCubicleNo} `
                var result = await database.execute(query1);
                if (result[0].length > 0) {
                    var batchStartCheck = await objPreWeighmentCheck.checkBatchStartFORAlert(alertArray[i]);

                    let now = new Date();
                    let todayDate = moment(now).format('YYYY-MM-DD');
                    var updateTime;
                    var currentTime = moment(now, 'HH:mm:ss');
                    if (alertArray[i].AlertTime!= undefined && alertArray[i].AlertTime.split(":")[0].length == 1) {
                        let updateTime1 = "0" + alertArray[i].AlertTime
                        updateTime = updateTime1;
                    }
                    else {
                        updateTime = alertArray[i].AlertTime;
                    }

                    // updatedTime = moment(alertArray[i].AlertTime, 'HH:mm:ss')
                    //     .add(alertArray[i].intGroupParam, 'minutes')
                    let datetimeA = moment(moment(alertArray[i].AlertDate).format('YYYY-MM-DD') + " " + updateTime);
                    let datetimeB = moment(moment(todayDate).format('YYYY-MM-DD') + " " + currentTime.format("HH:mm:ss"));
                    let datetimeC = datetimeB.diff(datetimeA, 'minutes');

                    if (blnCalibORWeigmntStart != true && batchStartCheck === "Batch Started,") {
                        var impresentt = globalData.impresentarr.find(k => parseFloat(k.ids) == alertArray[i].IDSNO);
                        if (datetimeC >= alertArray[i].intGroupParam  && ( impresentt != undefined && impresentt.impresent ==true )) {
                            var flagstatus = await objPreWeighmentCheck.checkgrpflag(alertArray[i]);
                            let sendIp = serverConfig.strIpSeries + alertArray[i].IDSNO;
                            let protocol = 'DM0G0Group Weighment, Pending,,,,';
                            await protocolHandler.sendProtocol(protocol, sendIp);

                            // alertArray[i].AlertTime = moment(currentTime).format('HH:mm:ss');
                            // alertArray[i].AlertDate = moment(todayDate).format('YYYY-MM-DD');
                            if (flagstatus == 0) {
                                var getTime = [];
                                let time =  moment(moment(alertArray[i].AlertDate).format('YYYY-MM-DD') + " " + updateTime)
                                getTime.push(time); 
                                
                                for(let value of getTime){
                                    var setTime = moment(value).add(alertArray[i].intGroupParam, 'minutes');
                                //   console.log(setTime);
                                  let datetime1 = setTime
                                  let datetime2 = datetimeB;
                                  let datetimer = datetime2.diff(datetime1, 'minutes');
                                    if(datetimer < 0)
                                    {
                                        alertArray[i].AlertTime = moment(value).format('HH:mm:ss');
                                        // alertArray[i].AlertDate = moment(todayDate).format('YYYY-MM-DD');
                                        alertArray[i].AlertDate = moment(now);
                                        var groupAlertRes = await database.execute(`UPDATE tbl_batches SET dt1='${date1.format(now, 'YYYY-MM-DD')}', tm1='${moment(value).format('HH:mm:ss')}', grpflag =1 WHERE Batch= '${alertArray[i].strBatch}' AND (Status = 'S' OR Status = 'R')`);
                                        console.log(` time updated successfully: ` + moment(value).format('HH:mm:ss'));
                                    }else{
                                        getTime.push(setTime);
                                    }
                                }
                               
                             
                            }

                        }
                       
                    }
                } else {
                    globalData.alertArrTemp = globalData.alertArrTemp.filter(k => k.IDSNO != alertArray[i].IDSNO);
                    console.log("data filter batch is resume");
                    alertArray = alertArray.filter(k => k.IDSNO != alertArray[i].IDSNO);

                }

            }
        }
    } catch (error) {
        console.log(error);
            
    }
    }
    /**
     * @param {*} IDSNO IDSSR NO
     * @description Below function is for alerts
     */
    handleDRProtocol(IDSNO) {
        return new Promise((resolve, reject) => {
            // First we have to update the time for specific Ids in alerts array
            // let now = new Date();
            // let tempAlertObj = globalData.alertArrTemp.find(k => k.IDSNO == parseInt(IDSNO));
            // if (tempAlertObj != undefined) {
            //     let currentTime = date1.format(now, 'hh:mm:ss')
            //     tempAlertObj.AlertTime = currentTime;
            // }
            // console.log(globalData.alertArrTemp)
            resolve('+');
        })
    }
    /**
     * 
     */
    async updateAlertObject() {
        let scanCubicle = {
            str_tableName: "tbl_cubical",
            data: '*',
            condition: [
                { str_colName: 'Sys_flagAlert', value: 1 },
            ]
        }
        let result = await database.select(scanCubicle);
        if (result[0].length > 0) {
            for (let val of result[0]) {
                let cubicNo = val.Sys_CubicNo;

                let tempAlertObj = globalData.alertArrTemp.find(k => k.intCubicleNo == cubicNo);
                const objAlert = {
                    str_tableName: 'tbl_alert_param_duration',
                    data: '*',
                }

                let alerParam = await database.select(objAlert);

                let objAlertParam = alerParam[0].find(k => k.CubicNo == cubicNo);

                // let batchesParam = await database.execute(`SELECT * FROM tbl_batches WHERE Batch= '${val.Sys_Batch}' AND (STATUS = 'S' OR STATUS = 'R')`);
                let batchesParam = await database.execute(`SELECT * FROM tbl_batches WHERE Batch= '${val.Sys_Batch}'`);


                if (batchesParam[0].length > 0) {
                    // if (val.Sys_RptType == 1) {
                    //     globalData.alertArrTemp = globalData.alertArrTemp
                    //     .filter(k => k.IDSNO != val.Sys_IDSNo)
                    // } else {
                    if (tempAlertObj !== undefined) {
                        if (objAlertParam.Group == 0) { // Group alerts are only for Standard run

                            globalData.alertArrTemp = globalData.alertArrTemp
                                .filter(k => k.IDSNO != val.Sys_IDSNo)

                        } else {

                            tempAlertObj.strBatch = val.Sys_Batch;
                            tempAlertObj.intGroupParam = objAlertParam.Group;
                            tempAlertObj.AlertTime = batchesParam[0][0].tm1;
                            tempAlertObj.IDSNO = val.Sys_IDSNo;
                            tempAlertObj.AlertDate = batchesParam[0][0].dt1;
                            tempAlertObj.impresent = false;

                        }
                    } else {
                        if (objAlertParam.Group != 0) {
                            let tempobj = {
                                intCubicleNo: cubicNo,
                                strBatch: val.Sys_Batch,
                                intGroupParam: objAlertParam.Group,
                                AlertTime: batchesParam[0][0].tm1,
                                IDSNO: val.Sys_IDSNo,
                                AlertDate: batchesParam[0][0].dt1,
                                impresent :false

                            }
                            globalData.alertArrTemp.push(tempobj)
                            console.log("data push sucessfully");
                        }
                    }
                    // }
                }
                if (batchesParam[0].length == 0) {
                    if (objAlertParam.Group == 0) { // Group alerts are only for Standard run        
                        globalData.alertArrTemp = globalData.alertArrTemp
                            .filter(k => k.IDSNO != val.Sys_IDSNo)
                        console.log("data deleted sucessfully" + val.Sys_IDSNo);

                    }
                }
                let updateCubicAlertVal = {
                    str_tableName: "tbl_cubical",
                    data: [
                        { str_colName: 'Sys_flagAlert', value: 0 },
                    ],
                    condition: [
                        { str_colName: 'Sys_CubicNo', value: cubicNo },
                    ]
                }
                await database.update(updateCubicAlertVal);
                console.log("flag alert set 0 in cubical");
            }
            //  console.log('ASD',globalData.alertArrTemp)
        }


    }
}
module.exports = AlertModel;
