var clsDatabase = require('../../database/clsQueryProcess');
var globalData = require('../../global/globalData');
var database = new clsDatabase();
const clsActivityLog = require('../clsActivityLogModel');
const Login = require('../clsLoginModal');
const objLogin = new Login();
const printReport = require('../Weighments/clsPrintReport');
const serverConfig = require('../../global/severConfig');
const objPrintReport = new printReport();
const objActivityLog = new clsActivityLog();
const clsArea = require('../../model/clsAreaSelection');
var objArea = new clsArea();
class Container {

    constructor() { }

    async getTareWt(strContainerNo, idsNo, area, cubType) {
        try {
            var objBin = globalData.arrBinInfo.find(k => k.idsNo == idsNo);
            var cuurentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == objBin.selIds);
            area = cuurentCubicle.Sys_Area;
            cubType = cuurentCubicle.Sys_CubType;
            // var objSelectTare = {
            //     str_tableName: '',
            //     data: '*',
            //     condition: [
            //         { str_colName: 'Bin_BinID', value: strContainerNo, comp: 'eq' },
            //         { str_colName: 'Bin_Status', value: 0, comp: 'eq' }
            //     ]
            // }

            var objSelectTare = {
                str_tableName: '',
                data: '*',
                condition: [
                    { str_colName: 'Bin_BinID', value: strContainerNo, comp: 'eq' },
                    { str_colName: 'Bin_Status', value: 0, comp: 'eq' },
                    { str_colName: 'Bin_BatchComplete', value: 0, comp: 'eq' },
                    { str_colName: 'Bin_IDSNo', value: objBin.selIds, comp: 'eq' },
                    { str_colName: 'Bin_BatchNo', value: objBin.selBatch, comp: 'eq' },
                    { str_colName: 'Bin_ProductID', value: objBin.selProductId, comp: 'eq' },
                    { str_colName: 'Bin_ProductName', value: objBin.selProductName, comp: 'eq' },
                    { str_colName: 'Bin_ProductVersion', value: objBin.selProductVersion, comp: 'eq' },
                    { str_colName: 'Bin_Version', value: objBin.selVersion, comp: 'eq' },

                ]
            }

            if ((area.toUpperCase() == "COMPRESSION" || area.toUpperCase() == "EFFERVESCENT COMPRESSION"
                || area.toUpperCase() == "EFFERVESCENT GRANULATION" || area.toUpperCase() == "GRANULATION")
                && cubType.toUpperCase() != 'IPC') {
                objSelectTare.str_tableName = "tbl_bin_master_comp";
            }
            else if (area.toUpperCase() == "COATING" && cubType.toUpperCase() != 'IPC') {
                objSelectTare.str_tableName = "tbl_bin_master_coat";
            }
            else if (area.toUpperCase() == "CAPSULE FILLING" && cubType.toUpperCase() != 'IPC') {
                objSelectTare.str_tableName = "tbl_bin_master_cap";
            } else if (cubType.toUpperCase() == 'IPC') {
                objSelectTare.str_tableName = "tbl_bin_master_ipc";
            }
            var tareResult = await database.select(objSelectTare);

            var objBin = globalData.arrBinInfo.find(k => k.idsNo == idsNo);
            objBin.tareWt = tareResult[0][0].Bin_TareWt
            return objBin.tareWt;

        } catch (error) {
            console.log(error);
        }
    }

    /**
     * this function will send a IPC List as per Area
     * Total bins will be saved for the one time if user wants to update the bin then user has to logout and login again.
     * @param {*} idsNo : IDs no on which weighment is in progress
     * @param {*} area : Area name for which list is to be displayed
     * @param {*} cubType : Cubicle type for which list is to be displayed
     * @param {*} fillListAgain : if this flag is true then we will fill list again.
     */
    async sendIPCList(idsNo, area, cubType, fillListAgain = false, typeSelection = '1') {
        try {
            // await objLogin.updateWeighmentStatus(idsNo, 0);
            var objLocation = globalData.arrIPCLocation.find(k => k.idsNo == idsNo);
            var objBin = globalData.arrBinInfo.find(k => k.idsNo == idsNo);
            var objBinIndex = globalData.arrBinIndex.find(k => k.idsNo == idsNo);
            var objTotalBins = globalData.arrTotalBins.find(k => k.idsNo == idsNo);
            var cuurentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == objBin.selIds);
            area = cuurentCubicle.Sys_Area;
            cubType = cuurentCubicle.Sys_CubType;
            var objSelectBins = {
                str_tableName: '',
                data: '*',
                condition: [
                    { str_colName: 'Bin_IDSNo', value: objBin.selIds, comp: 'eq' },
                    { str_colName: 'Bin_ProductID', value: objBin.selProductId, comp: 'eq' },
                    { str_colName: 'Bin_ProductName', value: objBin.selProductName, comp: 'eq' },
                    { str_colName: 'Bin_ProductVersion', value: objBin.selProductVersion, comp: 'eq' },
                    { str_colName: 'Bin_Version', value: objBin.selVersion, comp: 'eq' },
                    { str_colName: 'Bin_BatchComplete', value: 0, comp: 'eq' },
                    { str_colName: 'Bin_Status', value: 0, comp: 'eq' },
                    { str_colName: 'Bin_BatchNo', value: objBin.selBatch, comp: 'eq' }
                ]
            }
            // if(objLocation!= undefined && typeSelection == '1') {
            //     objSelectBins.condition.push( { str_colName: 'Bin_TareWt', value: 0, comp: 'eq' })
            // } else if(objLocation!= undefined && typeSelection == '2') {
            //     objSelectBins.condition.push( { str_colName: 'Bin_TareWt', value: 0, comp: 'ne' })
            // }
            // if ((area.toUpperCase() == "COMPRESSION" || area.toUpperCase() == "EFFERVESCENT COMPRESSION"
            //     || area.toUpperCase() == "EFFERVESCENT GRANULATION" || area.toUpperCase() == "GRANULATION")
            //     && cubType.toUpperCase() != 'IPC')
            if ((area.toUpperCase() == "COMPRESSION" || area.toUpperCase() == "EFFERVESCENT COMPRESSION"
                || area.toUpperCase() == "GRANULATION")
                && cubType.toUpperCase() != 'IPC') {
                objSelectBins.str_tableName = "tbl_bin_master_comp";
            }

            else if (area.toUpperCase() == "EFFERVESCENT GRANULATION" && cubType.toUpperCase() == 'IPQC' && cubType.toUpperCase() != 'IPC') {
                objSelectBins.str_tableName = "tbl_bin_master_ipc";
            }
            else if (area.toUpperCase() == "COATING" && cubType.toUpperCase() != 'IPC') {
                objSelectBins.str_tableName = "tbl_bin_master_coat";
            }
            else if (area.toUpperCase() == "CAPSULE FILLING" && cubType.toUpperCase() != 'IPC') {
                objSelectBins.str_tableName = "tbl_bin_master_cap";
            } else if (cubType.toUpperCase() == 'IPC') {
                objSelectBins.str_tableName = "tbl_bin_master_ipc";
            } else if (area.toUpperCase().includes('IPQA')) {
                var cubicIPQCType = cuurentCubicle.Sys_IPQCType;
                if (cubicIPQCType.toUpperCase() == "COMPRESSION") {
                    objSelectBins.str_tableName = "tbl_bin_master_comp";
                } else if (cubicIPQCType.toUpperCase() == "CAPSULE FILLING") {
                    objSelectBins.str_tableName = "tbl_bin_master_cap";
                } else if (cubicIPQCType.toUpperCase() == "COATING") {
                    objSelectBins.str_tableName = "tbl_bin_master_coat";
                }
            }

            var resBinData = await database.select(objSelectBins);

            var bins = resBinData[0].map(obj => {
                return obj.Bin_BinID;
            });

            if (objTotalBins == undefined) {
                globalData.arrTotalBins.push({ idsNo: idsNo, selBins: bins })
            }
            else {
                objTotalBins.selBins = bins;
            }

            return await this.sendSelectedBinsByIndex(idsNo, cubType, area);

        } catch (error) {
            return error;
        }
    }

    /**
     * this function will send 1-40 bins to ids and on LDN protocol next 40 will get transmitted.
     * @param {*} idsNo 
     * @param {*} cubType 
     * @param {*} area 
     */
    async sendSelectedBinsByIndex(idsNo, cubType, area) {
        try {

            var objBinIndex = globalData.arrBinIndex.find(k => k.idsNo == idsNo);
            var objTotalBins = globalData.arrTotalBins.find(k => k.idsNo == idsNo);
            var objBin = globalData.arrBinInfo.find(k => k.idsNo == idsNo);
            var strBins = ""
            for (let index = objBinIndex.startIndex; index <= objBinIndex.endIndex; index++) {
                strBins = strBins + objTotalBins.selBins[index] + ",";
            }

            //remove unwanted undefined 
            strBins = strBins.replace(/undefined,/g, '');

            if (strBins.includes(',') == false) {
                //strBins = "DM0B0ALL IPCs ARE OVER,FOR THIS BATCH,,,";
                strBins = "DM0B0No IPC Available,,,,";
                /**
                 * @description As per SHEETAL, if list of ipc over for IPC cubicle set total bins to 0 in
                 * `tbl_cubicle_bin_setting` for current IPC cubicle 
                 */
                var cubicleObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
                if (cubicleObj.Sys_CubType == 'IPC') {
                    var updateObj = {
                        str_tableName: 'tbl_cubicle_bin_setting',
                        data: [
                            { str_colName: 'Sys_TotalBin', value: 0 },
                        ],
                        condition: [
                            { str_colName: 'Sys_IDS', value: idsNo, comp: 'eq' },
                        ]
                    }
                    // await database.update(updateObj);
                    /* Added by Pradip Shinde on 28/09/2020
                    As per sheetal and pushkar if cubic type is IPC then if total bins are completed then batch
                     will end from interface side 
                    */
                    var totalSelectedBins = 0;
                    var totolCompleted = 0;
                    var selectBinSettings = {
                        str_tableName: 'tbl_cubicle_bin_setting',
                        data: '*',
                        condition: [
                            { str_colName: 'Sys_IDS', value: idsNo, comp: 'eq' },
                        ]
                    }
                    var binSettingResult = await database.select(selectBinSettings);
                    if (binSettingResult[0].length != 0) {
                        totalSelectedBins = binSettingResult[0][0].Sys_TotalBinSelected;
                    }
                    //----------------------------------------------------------------//
                    var selectCompleted = {
                        str_tableName: 'tbl_bin_master_ipc',
                        data: '*',
                        condition: [
                            { str_colName: 'Bin_IDSNo', value: objBin.selIds, comp: 'eq' },
                            { str_colName: 'Bin_ProductID', value: objBin.selProductId, comp: 'eq' },
                            { str_colName: 'Bin_ProductName', value: objBin.selProductName, comp: 'eq' },
                            { str_colName: 'Bin_ProductVersion', value: objBin.selProductVersion, comp: 'eq' },
                            { str_colName: 'Bin_Version', value: objBin.selVersion, comp: 'eq' },
                            { str_colName: 'Bin_BatchComplete', value: 0, comp: 'eq' },
                            { str_colName: 'Bin_Status', value: 1, comp: 'eq' },
                            { str_colName: 'Bin_BatchNo', value: objBin.selBatch, comp: 'eq' }
                        ]
                    }
                    var completedResult = await database.select(selectCompleted);
                    if (completedResult[0].length != 0) {
                        totolCompleted = completedResult[0].length;
                    }
                    if (totolCompleted == totalSelectedBins) {
                        var updateFlag = {
                            str_tableName: 'tbl_bin_master_ipc',
                            data: [
                                { str_colName: 'Bin_BatchComplete', value: 1 },
                            ],
                            condition: [
                                { str_colName: 'Bin_IDSNo', value: objBin.selIds, comp: 'eq' },
                                { str_colName: 'Bin_ProductID', value: objBin.selProductId, comp: 'eq' },
                                { str_colName: 'Bin_ProductName', value: objBin.selProductName, comp: 'eq' },
                                { str_colName: 'Bin_ProductVersion', value: objBin.selProductVersion, comp: 'eq' },
                                { str_colName: 'Bin_Version', value: objBin.selVersion, comp: 'eq' },
                                { str_colName: 'Bin_Status', value: 1, comp: 'eq' },
                                { str_colName: 'Bin_BatchNo', value: objBin.selBatch, comp: 'eq' }
                            ]
                        }
                        // await database.update(updateFlag);
                    }
                }
                //strBins = await this.sendIPCProductList(cubType, area);
                return strBins;
            }
            else {
                return "LDN01" + strBins.trim(',') + ";";
            }

        } catch (error) {
            return error;
        }
    }

    async getContainerSerialNo(objBin, strTableName) {
        try {

            var objSelContainerSr = {
                str_tableName: strTableName,
                data: 'Max(Bin_SrNoWeighment) as SrNo',
                condition: [
                    { str_colName: 'Bin_IDSNo', value: objBin.selIds },
                    { str_colName: 'Bin_ProductID', value: objBin.selProductId },
                    { str_colName: 'Bin_ProductName', value: objBin.selProductName },
                    { str_colName: 'Bin_ProductVersion', value: objBin.selProductVersion },
                    { str_colName: 'Bin_Version', value: objBin.selVersion },
                    { str_colName: 'Bin_BatchNo', value: objBin.selBatch },
                ]

            }

            var result = await database.select(objSelContainerSr);

            return result[0][0];

        } catch (error) {
            return error;
        }
    }

    /**
     * This function will update the gross wt as well as net wt into table 
     * also this will update the weighment serial no of bin
     * and will update the bin_status = 1
     * @param {*} objBin : Bin Object which contains all the bin related information.
     */
    async saveContainerWeighment(objBin, area, cubType, IdsNo) {
        try {
            var cuurentCubicle = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == objBin.selIds);
            var bin = globalData.arrBinSetting;
            area = cuurentCubicle.Sys_Area;
            cubType = cuurentCubicle.Sys_CubType;
            var objUpdateBinInfo = {
                str_tableName: "",
                data: [
                    { str_colName: 'Bin_PrDate', value: objBin.prDate },
                    { str_colName: 'Bin_PrTime', value: objBin.prTime },
                    { str_colName: 'Bin_WeighingBalID', value: objBin.balanceID },
                    { str_colName: 'Bin_TareWt', value: objBin.tareWt },
                    { str_colName: 'Bin_GrossWt', value: objBin.grossWt },
                    { str_colName: 'bin_NetWeight', value: objBin.netWt },
                    { str_colName: 'Bin_DP', value: objBin.dp },
                    { str_colName: 'Bin_Status', value: 1 },
                    { str_colName: 'Bin_DoneUserID', value: objBin.userid },
                    { str_colName: 'Bin_DoneUserName', value: objBin.username },
                    { str_colName: 'Bin_IDSNoWeighment', value: objBin.idsNo },

                ],
                condition: [
                    { str_colName: 'Bin_BinID', value: objBin.selContainer },
                    { str_colName: 'Bin_IDSNo', value: objBin.selIds },
                    { str_colName: 'Bin_ProductID', value: objBin.selProductId },
                    { str_colName: 'Bin_ProductName', value: objBin.selProductName },
                    { str_colName: 'Bin_ProductVersion', value: objBin.selProductVersion },
                    { str_colName: 'Bin_Version', value: objBin.selVersion },
                    { str_colName: 'Bin_BatchNo', value: objBin.selBatch },
                    { str_colName: 'Bin_GrossWt', value: 0 },
                    { str_colName: 'Bin_Status', value: 0, comp: 'eq' },
                    { str_colName: 'Bin_BatchComplete', value: 0, comp: 'eq' },
                ]
            }

            if ((area.toUpperCase() == "COMPRESSION" || area.toUpperCase() == "EFFERVESCENT COMPRESSION"
                || area.toUpperCase() == "EFFERVESCENT GRANULATION" || area.toUpperCase() == "GRANULATION")
                && cubType.toUpperCase() != 'IPC') {
                objUpdateBinInfo.str_tableName = "tbl_bin_master_comp";
            }
            else if (area.toUpperCase() == "COATING" && cubType.toUpperCase() != 'IPC') {
                objUpdateBinInfo.str_tableName = "tbl_bin_master_coat";
            }
            else if (area.toUpperCase() == "CAPSULE FILLING" && cubType.toUpperCase() != 'IPC') {
                objUpdateBinInfo.str_tableName = "tbl_bin_master_cap";
            } else if (cubType.toUpperCase() == 'IPC') {
                objUpdateBinInfo.str_tableName = "tbl_bin_master_ipc";
            }

            var SerialNoOfContainer = await this.getContainerSerialNo(objBin, objUpdateBinInfo.str_tableName);
            // SerialNoOfContainer.SrNo == undefined ? 0 : SerialNoOfContainer.SrNo = SerialNoOfContainer.SrNo + 1;

            if(SerialNoOfContainer.SrNo == null){
                SerialNoOfContainer.SrNo = 1
            }
                else{
                    SerialNoOfContainer.SrNo = SerialNoOfContainer.SrNo + 1;
                } 
            objUpdateBinInfo.data.push({ str_colName: 'Bin_SrNoWeighment', value: SerialNoOfContainer.SrNo });

            var result = await database.update(objUpdateBinInfo);

            var checkData ={
                str_tableName: "tbl_cubicle_bin_setting",
                data: 'Sys_TotalBinSelected',
                condition: [
                    { str_colName: 'Sys_IDS', value: objBin.selIds, comp: 'eq' },
                    { str_colName: 'Sys_PrdID', value: objBin.selProductId, comp: 'eq' },
                    { str_colName: 'Sys_PrdName', value: objBin.selProductName, comp: 'eq' },
                    { str_colName: 'Sys_PrdVersion', value: objBin.selProductVersion, comp: 'eq' },
                    { str_colName: 'Sys_Version', value: objBin.selVersion, comp: 'eq' },
                    { str_colName: 'Sys_BatchNo', value: objBin.selBatch, comp: 'eq' },
                ]
            } 

            var selectBinSettings = await database.select(checkData);

            var checkData1 ={
                str_tableName: objUpdateBinInfo.str_tableName,
                data: 'COUNT(*) AS reccount',
                condition: [
                    { str_colName: 'Bin_IDSNo', value: objBin.selIds, comp: 'eq' },
                    { str_colName: 'Bin_ProductID', value: objBin.selProductId, comp: 'eq' },
                    { str_colName: 'Bin_ProductName', value: objBin.selProductName, comp: 'eq' },
                    { str_colName: 'Bin_ProductVersion', value: objBin.selProductVersion, comp: 'eq' },
                    { str_colName: 'Bin_Version', value: objBin.selVersion, comp: 'eq' },
                    { str_colName: 'Bin_BatchNo', value: objBin.selBatch, comp: 'eq' },
                    { str_colName: 'Bin_BatchComplete', value: 0, comp: 'eq' },
                    { str_colName: 'Bin_Status', value: 1, comp: 'eq' },
                ]

            } 
            var totalBins = await database.select(checkData1);

            if (selectBinSettings[0][0].Sys_TotalBinSelected === totalBins[0][0].reccount) {

                if (area.toUpperCase() == "INPROCESS-I"  ||
                    area.toUpperCase() == "INPROCESS-IV") {

                    var objBatchInfo = cuurentCubicle

                  

                    var batchCompletestatus ={
                        str_tableName:   objUpdateBinInfo.str_tableName,
                        data: [
                            { str_colName: 'Bin_BatchComplete', value: 1, comp: 'eq' },
                        ],
                        condition: [
                            { str_colName: 'Bin_CubicleNo', value:  objBatchInfo.Sys_CubicNo, comp: 'eq' },
                            { str_colName: 'Bin_BatchComplete', value: 0, comp: 'eq' },
                        ]
        
                    } 
                    // var result = await database.update(batchCompletestatus);      //batchcomplete status 1 when only in IPC i.e. without corrioder

                    var updateArchivedtable ={
                        str_tableName:   objUpdateBinInfo.str_tableName+ "_archived",
                        data: [
                            { str_colName: 'Bin_BatchComplete', value: 1, comp: 'eq' },
                        ],
                        condition: [
                            { str_colName: 'Bin_CubicleNo', value: objBatchInfo.Sys_CubicNo, comp: 'eq' },
                            { str_colName: 'Bin_BatchComplete', value: 0, comp: 'eq' },
                        ]
        
                    } 

                    var updateBinlocked ={
                        str_tableName:   "tbl_bin_list",
                        data: [
                            { str_colName: 'bin_locked', value: 0, comp: 'eq' },
                        ],
                        condition: [
                            { str_colName: 'BatchNo', value: objBatchInfo.Sys_Batch, comp: 'eq' },
                            { str_colName: 'cubicleType', value: objBatchInfo.Sys_CubType, comp: 'eq' },
                            { str_colName: 'CubicleNo', value: objBatchInfo.Sys_CubicNo, comp: 'eq' },
                            { str_colName: 'IsDiscarded', value: 0, comp: 'eq' },
                        ]
        
                    } 

                    var resultBinlocked = await database.update(updateBinlocked); 

                }
            }

            var objActivity = {};
            var userObj = globalData.arrUsers.find(k => k.IdsNo == IdsNo);
            Object.assign(objActivity,
                { strUserId: userObj.UserId },
                {
                    strUserName: userObj.UserName //sarr_UserData[0].UserName 
                },
                { activity: 'IPC weighing Completed on ' + IdsNo })
            await objActivityLog.ActivityLogEntry(objActivity);
            var cubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
            var bininfo = globalData.arrBinSetting.find(k => k.Sys_IDS == IdsNo);
            
            if (globalData.arrsAllParameters[0].tbl_PrintingMode == 'Auto' && bininfo.Sys_Printer != 'NA') {
                /**
                 * First here for online ipc print we need id of report
                 * So we are selecting id from table regarding current parameters
                 */
                var objSelectBinInfo = {
                    str_tableName: objUpdateBinInfo.str_tableName,
                    data: '*',
                    condition: [
                        { str_colName: 'Bin_BinID', value: objBin.selContainer },
                        { str_colName: 'Bin_IDSNo', value: objBin.selIds },
                        { str_colName: 'Bin_ProductID', value: objBin.selProductId },
                        { str_colName: 'Bin_ProductName', value: objBin.selProductName },
                        { str_colName: 'Bin_ProductVersion', value: objBin.selProductVersion },
                        { str_colName: 'Bin_Version', value: objBin.selVersion },
                        { str_colName: 'Bin_BatchNo', value: objBin.selBatch },
                    ]
                }
                var selectRes = await database.select(objSelectBinInfo);
                var RecNo = selectRes[0][0].RecNo;
                var sendObj = {};
                // var data = {
                //     str_cubicleType: cubType,
                //     str_ICReport: "Current",
                //     UserId: userObj.UserId,
                //     UserName: userObj.UserName,
                //     RecNo: RecNo,
                //     cubType: cubType,
                //     HmiId: objBin.selIds,
                //     waterMark: "false",
                //     idsNo: objBin.selIds
                // }

                var data = {
                    Bin_Area: selectRes[0][0].Bin_Area,
                    Bin_BatchComplete: selectRes[0][0].Bin_BatchComplete,
                    Bin_BatchNo: selectRes[0][0].Bin_BatchNo,
                    Bin_BatchSize: selectRes[0][0].Bin_BatchSize,
                    Bin_BinID: selectRes[0][0].Bin_BinID,
                    Bin_CheckedByID: selectRes[0][0].Bin_CheckedByID,
                    Bin_CheckedByName: selectRes[0][0].Bin_CheckedByName,
                    Bin_CleanerID: selectRes[0][0].Bin_CleanerID,
                    Bin_CleanerName: selectRes[0][0].Bin_CleanerName,
                    Bin_CubicName: selectRes[0][0].Bin_CubicName,
                    Bin_CubicleNo: selectRes[0][0].Bin_CubicleNo,
                    Bin_DP: selectRes[0][0].Bin_DP,
                    Bin_DoneUserID: selectRes[0][0].Bin_DoneUserID,
                    Bin_DoneUserName: selectRes[0][0].Bin_DoneUserName,
                    Bin_ExpDt: selectRes[0][0].Bin_ExpDt,
                    Bin_GrossWt: selectRes[0][0].Bin_GrossWt,
                    Bin_IDSNo: selectRes[0][0].Bin_IDSNo,
                    Bin_IDSNoWeighment: selectRes[0][0].Bin_IDSNoWeighment,
                    Bin_InitialStage: selectRes[0][0].Bin_InitialStage,
                    Bin_IsArchived: selectRes[0][0].Bin_IsArchived,
                    Bin_LabelHeader: selectRes[0][0].Bin_LabelHeader,
                    Bin_Lot: selectRes[0][0].Bin_Lot,
                    Bin_MfgDt: selectRes[0][0].Bin_MfgDt,
                    Bin_NextStage: selectRes[0][0].Bin_NextStage,
                    Bin_PrDate: selectRes[0][0].Bin_PrDate,
                    Bin_PrTime: selectRes[0][0].Bin_PrTime,
                    Bin_PreviousUsedBatch: selectRes[0][0].Bin_PreviousUsedBatch,
                    Bin_PreviousUsedPrdID: selectRes[0][0].Bin_PreviousUsedPrdID,
                    Bin_PreviousUsedPrdName: selectRes[0][0].Bin_PreviousUsedPrdName,
                    Bin_PreviousUsedPrdVer: selectRes[0][0].Bin_PreviousUsedPrdVer,
                    Bin_PreviousUsedVer: selectRes[0][0].Bin_PreviousUsedVer,
                    Bin_PrintNo: selectRes[0][0].Bin_PrintNo,
                    Bin_PrintNoSummary: selectRes[0][0].Bin_PrintNoSummary,
                    Bin_Printer: selectRes[0][0].Bin_Printer,
                    Bin_ProductID: selectRes[0][0].Bin_ProductID,
                    Bin_ProductName: selectRes[0][0].Bin_ProductName,
                    Bin_ProductVersion: selectRes[0][0].Bin_ProductVersion,
                    Bin_Released: selectRes[0][0].Bin_Released,
                    Bin_SrNoCubicle: selectRes[0][0].Bin_SrNoCubicle,
                    Bin_SrNoWeighment: selectRes[0][0].Bin_SrNoWeighment,
                    Bin_Status: selectRes[0][0].Bin_Status,
                    Bin_TareWt: selectRes[0][0].Bin_TareWt,
                    Bin_TotalBinNo: selectRes[0][0].Bin_TotalBinNo,
                    Bin_TotalSelectedBin: selectRes[0][0].Bin_TotalSelectedBin,
                    Bin_Version: selectRes[0][0].Bin_Version,
                    Bin_WeighingBalID: selectRes[0][0].Bin_WeighingBalID,
                    Bin_useBefore: selectRes[0][0].Bin_useBefore,
                    RecNo: selectRes[0][0].RecNo,
                    Sys_DateNA: selectRes[0][0].Sys_DateNA,
                    bin_NetWeight: selectRes[0][0].bin_NetWeight,
                    UserId: userObj.UserId,
                    UserName: userObj.UserName,
                    str_ICReport: "Current",
                    str_cubicleType: cubType,
                }


                Object.assign(sendObj, { data: data }, { FileName: 'RepoBinLabel' });
                var tempCubic = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IdsNo);
                if (tempCubic.Sys_RptType == 0 && globalData.arrsAllParameters[0].tbl_PrintingMode == 'Auto') {
                    if (serverConfig.ProjectName == 'CIPLA_INDORE' && serverConfig.CompanyName == "cipla 4") {
                        await objPrintReport.generateOnlineIPCReport(sendObj, bininfo.Sys_Printer, objBin);

                        setTimeout(async () => {
                            await objPrintReport.generateOnlineIPCReport(sendObj, bininfo.Sys_Printer, objBin);
                        }, 2000);

                    }
                    else {
                        await objPrintReport.generateOnlineIPCReport(sendObj, bininfo.Sys_Printer, objBin);
                    }
                }
            }

            return result;

        } catch (error) {
            console.log(error)
            return error;
        }
    }
    /**
     * This function will send IDSNO : ProductID list of all the Cubicles 
     * Whose area is matching
     * @param {*} strCubicType 
     * @param {*} strArea 
     */
    async sendIPCProductList(strCubicType, strArea) {
        try {
            if(strArea == 'Compression' || strArea == 'Inprocess-IV'){
                var objProductList = {
                    str_tableName: 'tbl_cubical',
                    data: '*',
                    condition: [
                        { str_colName: 'Sys_Area', value: strArea, comp: 'eq' },
                        { str_colName: 'Sys_CubType', value: 'IPC', comp: 'eq' },
                        { str_colName: 'Sys_ProductName', value: "None", comp: 'ne' },
                    ]
                }
                var resProduct = await database.select(objProductList);
                var strProductList = "";
                resProduct[0].forEach(Product => {
                    if (Product.Sys_BFGCode != null && Product.Sys_BFGCode != "" && Product.Sys_BFGCode != "NULL") {
                        strProductList = strProductList + Product.Sys_IDSNo + " : " + Product.Sys_BFGCode + ",";
                    }
                });
                if (strProductList != "") {
                    return "LDP01" + strProductList.trim(',') + ";";
                } else {
                    var retProtocol = await objArea.areaSelection();   //if IPC Not batch started then allowed to other area test
                   return retProtocol;
                }
            }else {
                var objProductList = {
                    str_tableName: 'tbl_cubical',
                    data: '*',
                    condition: [
                        { str_colName: 'Sys_Area', value: strArea, comp: 'eq' },
                        { str_colName: 'Sys_CubType', value: 'IPQC', comp: 'ne' },
                        { str_colName: 'Sys_ProductName', value: "None", comp: 'ne' },
                    ]
                }
                var resProduct = await database.select(objProductList);
                var strProductList = "";
                resProduct[0].forEach(Product => {
                    if (Product.Sys_BFGCode != null && Product.Sys_BFGCode != "" && Product.Sys_BFGCode != "NULL") {
                        strProductList = strProductList + Product.Sys_IDSNo + " : " + Product.Sys_BFGCode + ",";
                    }
                });
                if (strProductList != "") {
                    return "LDP00" + strProductList.trim(',') + ";";
                } else {
                    return 'LEP';
                }

            }

        } catch (error) {
            //  return error;
            throw new Error(error);
        }
    }
    /**
     * 
     * @param {*} idsNo
     * @description Function handles List Next `LNN` 
     */
    async handleLN(idsNo) {
        try {
            var cubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            var objBinsArray = globalData.arrTotalBins.find(k => k.idsNo == idsNo);
            var arrBins = objBinsArray.selBins;
            var objBinInfo = globalData.arrBinIndex.find(k => k.idsNo == idsNo);
            if (arrBins.length > 43) {
                objBinInfo.startIndex = objBinInfo.startIndex + 43;
                objBinInfo.endIndex = objBinInfo.endIndex + 43;
                // if (objBinInfo.startIndex > arrBins.length) {
                //     objBinInfo.startIndex = arrBins.length - 43;
                //     objBinInfo.endIndex = arrBins.length
                // }
                var returnProtocol = await this.sendIPCList(idsNo, cubicInfo.Sys_Area, cubicInfo.Sys_CubType, true)
                return returnProtocol;
            } else {
                return '+';
            }
        } catch (err) {
            return '+';
        }
    }
    /**
     * 
     * @param {*} idsNo
     * @description Function handles List Next `LPN` 
     */
    async handleLP(idsNo) {
        try {
            var cubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo);
            var objBinsArray = globalData.arrTotalBins.find(k => k.idsNo == idsNo);
            var arrBins = objBinsArray.selBins;
            var objBinInfo = globalData.arrBinIndex.find(k => k.idsNo == idsNo);
            if (arrBins.length > 43) {
                objBinInfo.startIndex = objBinInfo.startIndex - 43;
                objBinInfo.endIndex = objBinInfo.endIndex - 43;
                if (objBinInfo.startIndex < 0 || objBinInfo.endIndex < 0) {
                    objBinInfo.startIndex = 0;
                    objBinInfo.endIndex = 43;
                } else {
                    return '+';
                }
                var returnProtocol = await this.sendIPCList(idsNo, cubicInfo.Sys_Area, cubicInfo.Sys_CubType, true)
                return returnProtocol;
            } else {
                return '+';
            }
        } catch (err) {
            return '+';
        }
    }

}

module.exports = Container