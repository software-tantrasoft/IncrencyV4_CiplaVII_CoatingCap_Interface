const serverConfig = require('../global/severConfig');
const globalData = require('../global/globalData');
const timeZone = require('../middleware/setTimeZone');
const request = require('request');
const jsonTareCmd = require('../global/tare.json');

const Database = require('../database/clsQueryProcess');
const database = new Database();
class ProcessWTModel {
    //WT10B0002Below Limit,,,Ä 
    //WT1L S001 19.000
    //  WTmtL0###
    //  Here m=Menu, t=F for Filled, =E for Empty, =N for Net, otherwise 0. 
    //  L = 1 For Within, A For Above Limit, B For Below Limit, D For Double value 0 For Value near zero Or Negative Value. 
    // ### Is current sample number
    ProcessWT(str_Protocol, IDSSrNo) {
        return new Promise((resolve, reject) => {
            StrParamNum = str_Protocol.substring(3, 4);// Menus Number
            IntSampleNos = str_Protocol.substring(8, 10);// Sample number of weight recevied 

        })
    }
    //**************************************************************************************************** */
    // Below function use for WS protocol when comes for Balance and Vernier,
    //*************************************************************************************************** */
    async processWS(IDSSrNo, str_Protocol) {

        var tempLimObj = globalData.arr_limits.find(k => k.idsNo == IDSSrNo);
        let arrPaticleData = globalData.arrPaticleData.find(ht => ht.idsNo == IDSSrNo);
        let arrpercentFineData = globalData.arrpercentFineData.find(ht => ht.idsNo == IDSSrNo);
        var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == IDSSrNo);
        var objLotData = globalData.arrLot.find(k => k.idsNo == IDSSrNo);

        //var productTypeObj = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo)
        var objProductType = globalData.arrProductTypeArray.find(k => k.idsNo == IDSSrNo)

        var objHardness = globalData.arrHardness425.find(k => k.idsNo == IDSSrNo);



        // console.log(tempLimObj)
        var menuId = str_Protocol.substring(2, 3);
        var sendProtocol;
        switch (menuId) {
            case '1':
                var nominal = tempLimObj.Individual.nominal;
                if (serverConfig.ProjectName == 'MLVeer') {
                    let unit = tempLimObj.Individual.unit;
                    sendProtocol = await this.sendVL(nominal, IDSSrNo, unit);
                } else {
                    sendProtocol = await this.sendVL(nominal, IDSSrNo);
                }

                return (sendProtocol);
                break;
            case '2':
                var nominal = tempLimObj.Group.nominal;
                sendProtocol = await this.sendVL(nominal, IDSSrNo);
                return (sendProtocol);
                break;
            case '3':
                var nominal = tempLimObj.Thickness.nominal;
                //sendProtocol = await this.sendVL(nominal, IDSSrNo);
                sendProtocol = await this.sendVLforVernier(nominal, IDSSrNo);
                return (sendProtocol);
                break;
            case '4':
                if (objProductType.productType == 2) {
                    var nominal = tempLimObj.Diameter.nominal;
                    //sendProtocol = await this.sendVL(nominal, IDSSrNo);
                    sendProtocol = await this.sendVLforVernier(nominal, IDSSrNo);
                    return (sendProtocol);
                    break;
                }
                else {
                    var nominal = tempLimObj.Breadth.nominal;
                    //sendProtocol = await this.sendVL(nominal, IDSSrNo);
                    sendProtocol = await this.sendVLforVernier(nominal, IDSSrNo);
                    return (sendProtocol);
                    break;
                }

            case '5':
                var nominal = tempLimObj.Length.nominal;
                //sendProtocol = await this.sendVL(nominal, IDSSrNo);
                sendProtocol = await this.sendVLforVernier(nominal, IDSSrNo);

                return (sendProtocol);
                break;
            case '6':

                var nominal = tempLimObj.Diameter.nominal;
                sendProtocol = await this.sendVLforVernier(nominal, IDSSrNo);
                return (sendProtocol);
                break;
            case '8':
                var ParamName = 'Ind_Layer';
                if (serverConfig.ProjectName == "RBH") {
                    ParamName = 'Ind_Empty';
                    sendProtocol = `VL999,0.002,999,0.002,`
                    return (sendProtocol);
                }
                var nominal = tempLimObj[ParamName].nominal;
                sendProtocol = await this.sendVL(nominal, IDSSrNo);
                return (sendProtocol);
                break;
            case '9':
                var nominal = tempLimObj.Grp_Layer.nominal;
                sendProtocol = await this.sendVL(nominal, IDSSrNo);
                return (sendProtocol);
                break;
            case 'L':
                var nominal = tempLimObj.Ind_Layer1.nominal;
                sendProtocol = await this.sendVL(nominal, IDSSrNo);
                return (sendProtocol);
                break;
            case '9':
                var nominal = tempLimObj.Grp_Layer1.nominal;
                sendProtocol = await this.sendVL(nominal, IDSSrNo);
                return (sendProtocol);
                break;
            case 'P': // Particle Size
                var nominal = tempLimObj.PartSize.nominal;
                //  sendProtocol = this.sendVL(nominal);
                return ('WPP001TESTSAMPLE,');
                break;
            case 'F': // Fine Percentage
                // var nominal = tempLimObj.PartSize.nominal;
                //  sendProtocol = this.sendVL(nominal);
                return ('WPF001TESTSAMPLE,');
                break;
            case 'I':
                return (`VL9999,0.014,9999,0.014,`);
                break;
            case "D":
                /**********
                 * for Sun Halol
                 */
                if (objProductType.productType == 4 && serverConfig.ProjectName == "SunHalolGuj1") {
                    var nominalforFill = 999;
                    var nominalforNet = 999;
                    sendProtocol = await this.sendVLForDiff(nominalforFill, nominalforNet, IDSSrNo);
                    return (sendProtocol);
                } else {
                    var nominalforFill = tempLimObj.Individual.nominal;
                    var nominalforNet = tempLimObj.Net.nominal;
                    if (serverConfig.ProjectName == 'MLVeer') {
                        let unit = tempLimObj.Individual.unit;
                        sendProtocol = await this.sendVLForDiff(nominalforFill, nominalforNet, IDSSrNo, unit);
                    } else {
                        sendProtocol = await this.sendVLForDiff(nominalforFill, nominalforNet, IDSSrNo);
                    }

                    return (sendProtocol);
                }
                break;
            case 'H':
                var Sys_PortNo = cubicalObj.Sys_PortNo;
                if (Sys_PortNo == 101 || Sys_PortNo == 102) {
                    var instrument = cubicalObj.Sys_Port1;
                    if (instrument == 'Hardness') {
                        objHardness.dataFlowStatus = true;
                        objHardness.protocolIncomingType = 'H';
                        // objHardness.idsIPAddress = idsIPAddress;
                    }
                    if (instrument == "Balance") {
                        if (objLotData.MS.substring(2, 3) == "P") {   // for particle size handle 
                            if (arrPaticleData.sampleNo > 0 && arrPaticleData.message != "") {
                                return (`DL03${arrPaticleData.message},`);
                            }
                            else {
                                var currentParticleSeizing = globalData.arrparticleSizingCurrentTest.find((k) => k.idsNo == IDSSrNo);
                                if (currentParticleSeizing.particleSeizing[0].isCompleted === 'NotCompleted') {
                                    var testFlag = currentParticleSeizing.particleSeizing[0].flag + currentParticleSeizing.particleSeizing[0].mesh;
                                    currentParticleSeizing.particleSeizing[0].isCompleted = 'Pending';
                                }
                                var message;
                                switch (testFlag) {
                                    case "aTestSample":
                                        message = "TEST SAMPLE";
                                        break;
                                    case 'b60':
                                        message = "BELOW 60 MESH";
                                        break;
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
                                    case 'aTray':
                                        message = "FINES ON TRAY";
                                        break;
                                    default:
                                        message = "";
                                        break;
                                }
                                return (`DL03${message},`);
                            }
                        }
                        if (objLotData.MS.substring(2, 3) == "F") {   // for %Fine handle 
                            if (arrpercentFineData.sampleNo > 0 && arrpercentFineData.message != "") {
                                return (`DL03${arrpercentFineData.message},`);
                            } else {
                                //%Fine arrays
                                var PerFineSelected = globalData.arrPerFineCurrentTest.find(k => k.idsNo == IDSSrNo);
                                var currentPerFine = globalData.arrPerFineTypeSelectedMenu.find(k => k.idsNo == IDSSrNo);
                                var selectTest = currentPerFine.selectedPerFine;
                                if (PerFineSelected[selectTest][0].isCompleted === 'NotCompleted') {
                                    var testFlag = PerFineSelected[selectTest][0].flag + PerFineSelected[selectTest][0].mesh;
                                    PerFineSelected[selectTest][0].isCompleted = 'Pending';
                                }
                                var message;
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
                                return (`DL03${message},`);
                            }
                        }
                    }
                } else if (Sys_PortNo == 103 || Sys_PortNo == 104) {
                    var instrument = cubicalObj.Sys_Port4;
                    if (instrument == 'Hardness') {
                        objHardness.dataFlowStatus = true;
                        objHardness.protocolIncomingType = 'H';
                        objHardness.idsIPAddress = idsIPAddress;
                    }
                }
                sendProtocol = '+';
                return (sendProtocol);
                break;
            case 'T':
                var Sys_PortNo = cubicalObj.Sys_PortNo;
                if (Sys_PortNo == 101 || Sys_PortNo == 102) {
                    var instrument = cubicalObj.Sys_Port2;
                    if (instrument == 'Hardness') {
                        objHardness.dataFlowStatus = true;
                        objHardness.protocolIncomingType = 'T';
                        objHardness.idsIPAddress = idsIPAddress;
                    }
                } else if (Sys_PortNo == 103 || Sys_PortNo == 104) {
                    var instrument = cubicalObj.Sys_Port3;
                    if (instrument == 'Hardness') {
                        objHardness.dataFlowStatus = true;
                        objHardness.protocolIncomingType = 'T';
                        objHardness.idsIPAddress = idsIPAddress;
                    }
                }
                sendProtocol = '+';
                return (sendProtocol);
                break;
            default:
                sendProtocol = '+';
                return (sendProtocol);
        }

    }

    async sendVLforVernier(nominal, idsNo) {
        var VLimit = 0.014;
        var tempVar = parseFloat(nominal) + parseFloat(nominal * 0.8);
        tempVar = this.FormatNumber(tempVar, 3);
        var sendProtocol = `VL${tempVar},${VLimit},${tempVar},${VLimit}`
        return sendProtocol;
    }
    async sendVL(nominal, idsNo, unit = 'gm') {



        const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(idsNo));
        var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(idsNo));

        let strBalId = tempCubicInfo.Sys_BalID;
        if (objOwner.owner == 'analytical') {
            strBalId = tempCubicInfo.Sys_BalID;
        } else {
            strBalId = tempCubicInfo.Sys_BinBalID;
        }

        var selectBalObj = {
            str_tableName: 'tbl_balance',
            data: '*',
            condition: [
                { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' },
            ]
        }
        let resultBal = await database.select(selectBalObj);
        var tempIM = globalData.arrHexInfo.find(k => k.idsNo == idsNo);
        var balSrNo = "";
        if (resultBal[0].length != 0) {
            balSrNo = resultBal[0][0].Bal_SrNo;
        } else {
            balSrNo = "";
        }

        var tareCmd = "";
        var appendVal = "";

        if (resultBal[0][0].Bal_Make.includes('Mettler') || resultBal[0][0].Bal_Make.includes('METTLER')) {
            var objTareCmd = jsonTareCmd.Mettler.find(mod => resultBal[0][0].Bal_Model.includes(mod.Model));
            if (objTareCmd == undefined) {

                appendVal = jsonTareCmd.Mettler.find(mod => mod.Model == "Default").TareCmd;
            }
            else {
                objTareCmd.SendCmd == "Y" ? appendVal = objTareCmd.TareCmd : appendVal = ""; // if tare command is configure not to send then it will not send  tare command.
            }
        }
        else if (resultBal[0][0].Bal_Make.includes('Sato') || resultBal[0][0].Bal_Make.includes('SARTO')) {
            var objTareCmd = jsonTareCmd.Satorious.find(mod => resultBal[0][0].Bal_Model.includes(mod.Model));
            if (objTareCmd == undefined) {
                appendVal = jsonTareCmd.Satorious.find(mod => mod.Model == "Default").TareCmd;
            }
            else {
                objTareCmd.SendCmd == "Y" ? appendVal = objTareCmd.TareCmd : appendVal = ""; // if tare command is configure not to send then it will not send  tare command.
            }

        }
        else {
            appendVal = "T"
        }


        // if (balSrNo.includes('ML')) {
        //     appendVal = 'T'
        //     //appendVal = 'Z'

        // } else {
        //     appendVal = 'Z'
        //     //appendVal = 'T'
        // }



        if (serverConfig.tareFlag == 'MLH') {
            appendVal = 'T ';
        }
        if (tempIM.IM != "IMC3") {
            let escChar = String.fromCharCode(27);
            if (tempCubicInfo.Sys_Area == "Effervescent Granulation" || tempCubicInfo.Sys_Area == "Granulation") {
                tareCmd = ""
            }
            else if (appendVal == "T" && (resultBal[0][0].Bal_Make.includes('Sato') || resultBal[0][0].Bal_Make.includes('SARTO'))) {
                tareCmd = `SP10${escChar}${appendVal},`
            }
            else {
                tareCmd = `SP10${appendVal},`
            }

            //this.sendProtocol('SP10Z,', str_IpAddress);
        } else {
            if (tempCubicInfo.Sys_Area == "Effervescent Granulation" || tempCubicInfo.Sys_Area == "Granulation") {
                tareCmd = ""
            }
            else if (resultBal[0][0].Bal_Make.includes('Sato') || resultBal[0][0].Bal_Make.includes('SARTO')) {
                tareCmd = `SP20${escChar}${appendVal},`
            }
            else {
                tareCmd = `SP20${appendVal},`
            }
        }
        if (serverConfig.ProjectName == 'RBH') {
            tareCmd = "";
        }

        var VlimitCal = resultBal[0][0].Bal_LeastCnt.split(".")
        var VLvalue = parseInt(VlimitCal[1])
        var DecimalCount = VLvalue.toString()
        if (DecimalCount.length <= 2) {
            var VLimit = 0.0014;
        } else {
            var VLimit = 0.014;
        }

        if (serverConfig.ProjectName == 'MLVeer') {
            if (unit == 'mg') {
                nominal = nominal / 1000;
                VLimit = VLimit / 1000;
            }
        }
        var tempVar = parseFloat(nominal) + parseFloat(nominal * 0.8);
        tempVar = this.FormatNumber(tempVar, 3);
        var sendProtocol = `VL${tempVar},${VLimit},${tempVar},${VLimit},${tareCmd}`
        return sendProtocol;
    }
    FormatNumber(num, intFormatNumber) {
        return parseFloat(Math.round(num * 1000) / 1000).toFixed(intFormatNumber);
    }
    async sendVLForDiff(nominalForFill, nominalForNet, idsNo, unit = 'gm') {
        var tareCmd = await this.getTareCommand(idsNo);
        var VLimit = 0.014;
        if (serverConfig.ProjectName == 'MLVeer') {
            if (unit == 'mg') {
                nominalForFill = nominalForFill / 1000;
                nominalForNet = nominalForNet / 1000;
                VLimit = VLimit / 1000;
            }
        }
        var tempVarFill = parseFloat(nominalForFill) + parseFloat(nominalForFill * 0.8);
        var tempVarNet = parseFloat(nominalForNet) + parseFloat(nominalForNet * 0.8);
        tempVarNet = tempVarNet.toFixed(4);




        if (serverConfig.ProjectName == 'SunHalolGuj1') {
            // because reports in mg that why we have to set to 0.010
            var sendProtocol = `VL${tempVarFill},0.010,${tempVarNet},0.010,${tareCmd}`
        } else {
            var sendProtocol = `VL${tempVarFill},${VLimit},${tempVarNet},${VLimit},${tareCmd}`
        }
        return sendProtocol;
    }

    async getTareCommand(idsNo) {
        try {
            const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(idsNo));
            var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(idsNo));

            let strBalId = tempCubicInfo.Sys_BalID;
            if (objOwner.owner == 'analytical') {
                strBalId = tempCubicInfo.Sys_BalID;
            } else {
                strBalId = tempCubicInfo.Sys_BinBalID;
            }

            var selectBalObj = {
                str_tableName: 'tbl_balance',
                data: '*',
                condition: [
                    { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' },
                ]
            }
            let resultBal = await database.select(selectBalObj);
            var tempIM = globalData.arrHexInfo.find(k => k.idsNo == idsNo);
            var balSrNo = "";
            if (resultBal[0].length != 0) {
                balSrNo = resultBal[0][0].Bal_SrNo;
            } else {
                balSrNo = "";
            }

            var tareCmd = "";
            var appendVal = "";

            if (resultBal[0][0].Bal_Make.includes('Mettler') || resultBal[0][0].Bal_Make.includes('METTLER')) {
                var objTareCmd = jsonTareCmd.Mettler.find(mod => resultBal[0][0].Bal_Model.includes(mod.Model));
                if (objTareCmd == undefined) {

                    appendVal = jsonTareCmd.Mettler.find(mod => mod.Model == "Default").TareCmd;
                }
                else {
                    objTareCmd.SendCmd == "Y" ? appendVal = objTareCmd.TareCmd : appendVal = ""; // if tare command is configure not to send then it will not send  tare command.
                }
            }
            else if (resultBal[0][0].Bal_Make.includes('Sato') || resultBal[0][0].Bal_Make.includes('SARTO')) {
                var objTareCmd = jsonTareCmd.Satorious.find(mod => resultBal[0][0].Bal_Model.includes(mod.Model));
                if (objTareCmd == undefined) {
                    appendVal = jsonTareCmd.Satorious.find(mod => mod.Model == "Default").TareCmd;
                }
                else {
                    objTareCmd.SendCmd == "Y" ? appendVal = objTareCmd.TareCmd : appendVal = ""; // if tare command is configure not to send then it will not send  tare command.
                }

            }
            else {
                appendVal = "T"
            }

            if (serverConfig.tareFlag == 'MLH') {
                appendVal = 'T ';
            }
            if (tempIM.IM != "IMC3") {
                let escChar = String.fromCharCode(27);
                if (tempCubicInfo.Sys_Area == "Effervescent Granulation" || tempCubicInfo.Sys_Area == "Granulation") {
                    tareCmd = ""
                }
                else if (appendVal == "T" && (resultBal[0][0].Bal_Make.includes('Sato') || resultBal[0][0].Bal_Make.includes('SARTO'))) {
                    tareCmd = `SP10${escChar}${appendVal},`
                }
                else {
                    tareCmd = `SP10${appendVal},`
                }

                //this.sendProtocol('SP10Z,', str_IpAddress);
            } else {
                if (tempCubicInfo.Sys_Area == "Effervescent Granulation" || tempCubicInfo.Sys_Area == "Granulation") {
                    tareCmd = ""
                }
                else if (resultBal[0][0].Bal_Make.includes('Sato') || resultBal[0][0].Bal_Make.includes('SARTO')) {
                    tareCmd = `SP20${escChar}${appendVal},`
                }
                else {
                    tareCmd = `SP20${appendVal},`
                }
            }
            if (serverConfig.ProjectName == 'RBH') {
                tareCmd = "";
            }

            return tareCmd;
        } catch (error) {
            console.log(error);
        }
    }
}



module.exports = ProcessWTModel;
