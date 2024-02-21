const Database = require("../../database/clsQueryProcess");
const database = new Database();
const globalData = require("../../global/globalData");
const moment = require("moment");
const serverConfig = require("../../global/severConfig");
const date = require("date-and-time");
const clsRemarkInComplete = require("../../model/clsRemarkIncomplete");
const objRemarkInComplete = new clsRemarkInComplete();
var Comman = require("./clsCommonFunction");
var comman = new Comman();
const clsActivityLog = require("../../model/clsActivityLogModel");
const objActivityLog = new clsActivityLog();
const sort = require("./checkForPendingCalib");


class CalibPowerBackup {
  /**
   *
   * @param {*} Cubcial_info
   * @param {*} Weightment_type
   * @param {*} Userinfo
   * @param {*} Idsno
   * @description Method for inserting backup data to `tbl_powerbackup`
   *
   */
  async insertCalibPowerBackupData(RepNo, calibtype, Bal_ID, IdsNo) {

    try {
      if (serverConfig.isPowerBackup) {
        const tempUserObject = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
        var now = new Date();
        //in powerbackup incomplate report serial number is updated at incomplatedatasave after data inserted to incomplate master
        const insertInpowerbakupobj = {
          str_tableName: "tbl_calibpowerbackup",
          data: [
            { str_colName: "RecSampleNo", value: 1 },
            { str_colName: "Inc_RepSerNo", value: RepNo },
            { str_colName: "IdsNo", value: IdsNo },
            { str_colName: "CalibrationType", value: calibtype },
            { str_colName: "BalanceID", value: Bal_ID },
            { str_colName: "UserID", value: tempUserObject.UserId },
            { str_colName: "CalibDate", value: date.format(now, "YYYY-MM-DD") },
          ],
        };
        var result = await database.save(insertInpowerbakupobj);
        return result;
      }
    } catch (err) {
      throw new Error(err);
    }
  }

  async deleteCalibPowerBackupData_old(CalibrationType, IdsNo) {
    try {
      const tempCubicInfo = globalData.arrIdsInfo.find(
        (k) => k.Sys_IDSNo == parseInt(IdsNo)
      );
      var objOwner = globalData.arrPreWeighCalibOwner.find(
        (k) => k.idsNo == parseInt(IdsNo)
      );
      var strVerid = tempCubicInfo.Sys_VernierID;
      var strBalId = tempCubicInfo.Sys_BalID;
      if (objOwner != undefined) {
        if (objOwner.owner == "analytical") {
          strBalId = tempCubicInfo.Sys_BalID;
        } else {
          strBalId = tempCubicInfo.Sys_BinBalID;
        }
      }
      if (serverConfig.isPowerBackup) {
        switch (CalibrationType) {
          case "1":
          case "4":
            CalibrationType = "Daily";
            break;

          case "2":
          case "5":
            CalibrationType = "Periodic";
            break;
          case "3":
            CalibrationType = "Vernier";
            strBalId = tempCubicInfo.Sys_VernierID;

            break;
          case "E":
            CalibrationType = "Eccentricity";
            break;

          case "R":
            CalibrationType = "Repeatability";
            break;
          case "U":
            CalibrationType = "Uncertainty";
            break;
        }

        var deleteObj = {
          str_tableName: "tbl_calibpowerbackup",
          condition: [
            { str_colName: "IdsNo", value: IdsNo },
            { str_colName: "CalibrationType", value: CalibrationType },
            { str_colName: "BalanceID", value: strBalId },
          ],
        };
        // console.log("calibpowerbakup discard");

        return await database.delete(deleteObj);
      }
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  async deleteCalibPowerBackupData(CalibrationType, IdsNo) {
    try {
      const tempCubicInfo = globalData.arrIdsInfo.find(
        (k) => k.Sys_IDSNo == parseInt(IdsNo)
      );
      var objOwner = globalData.arrPreWeighCalibOwner.find(
        (k) => k.idsNo == parseInt(IdsNo)
      );
      var strBalId = tempCubicInfo.Sys_BalID;
      var strVerid = tempCubicInfo.Sys_VernierID;
      if (objOwner != undefined) {
        if (objOwner.owner == "analytical") {
          strBalId = tempCubicInfo.Sys_BalID;
        } else {
          strBalId = tempCubicInfo.Sys_BinBalID;
        }
      }

      var selectCalibPowerBackupData = {
        str_tableName: "tbl_calibpowerbackup",
        data: "*",
        condition: [
          { str_colName: "IdsNo", value: IdsNo },
          { str_colName: "BalanceID", value: strBalId },
        ],
      };
      var result = await database.select(selectCalibPowerBackupData);
      if (result[0].length > 0) {
        var deleteObj = {
          str_tableName: "tbl_calibpowerbackup",
          condition: [
            { str_colName: "IdsNo", value: IdsNo },
            { str_colName: "BalanceID", value: strBalId },
          ],
        };
        console.log("calibpowerbakup discard");

        await database.delete(deleteObj);

      } else {
        var selectCalibPowerBackupData1 = {
          str_tableName: "tbl_calibpowerbackup",
          data: "*",
          condition: [
            { str_colName: "IdsNo", value: IdsNo },
            { str_colName: "BalanceID", value: strVerid },
          ],
        };
        var result1 = await database.select(selectCalibPowerBackupData1);
        if (result1[0].length > 0) {
          var deleteObj = {
            str_tableName: "tbl_calibpowerbackup",
            condition: [
              { str_colName: "IdsNo", value: IdsNo },
              { str_colName: "BalanceID", value: strVerid },
            ],
          };
          console.log("calibpowerbakup discard ");

          await database.delete(deleteObj);

          //
        }
      }
      return "ok";
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  async fetchCalibPowerBackupData(IdsNo, calibtype, BAL_ID) {
    try {
      // let tempserverConfigisPowerBackup = false;
      if (serverConfig.isPowerBackup) {
        var selectCalibPowerBackupData = {
          str_tableName: "tbl_calibpowerbackup",
          data: "*",
          condition: [
            { str_colName: "IdsNo", value: IdsNo },
            { str_colName: "CalibrationType", value: calibtype },
            { str_colName: "BalanceID", value: BAL_ID },
          ],
        };
        var result = await database.select(selectCalibPowerBackupData);
        let sendObj = {};
        Object.assign(sendObj, { status: true, result: result[0] });
        return sendObj;
      } else {
        let sendObj = {};
        Object.assign(sendObj, { status: false, result: [] });
        return sendObj;
      }
    } catch (err) {
      throw new Error(err);
    }
  }

  async sendCalibPowerBackupData_old(
    strReturnProtocol,
    PowerBackupData,
    IdsNo,
    str_IpAddress
  ) {
    try {
      var now = new Date();
      var currentdate = date.format(now, "YYYY-MM-DD");
      var Calibrationname = PowerBackupData[0].CalibrationType;
      const tempUserObject = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
      var curruser = tempUserObject.UserId;
      var calibtypeforipc = strReturnProtocol.substring(2, 3);
      var ipccalib = false;
      if (calibtypeforipc == "4" || calibtypeforipc == "5") {
        ipccalib = true;
      }
      // var BalanceID = PowerBackupData[0].BalanceID;
      var CalibrationType = "";
      switch (Calibrationname) {
        case "Daily":
          if (ipccalib) {
            CalibrationType = "4";
          } else {
            CalibrationType = "1";
          }

          break;
        case "Periodic":
          if (ipccalib) {
            CalibrationType = "5";
          } else {
            CalibrationType = "2";
          }

          break;
        case "Vernier":
          CalibrationType = "3";
          break;
        case "Eccentricity":
          CalibrationType = "E";
          break;
        case "Repeatability":
          CalibrationType = "R";
          break;
        case "Uncertainty":
          CalibrationType = "U";
          break;
      }

      var dayextendfordaily = false;
      var currenttime = date.format(now, "HH:mm:ss");
      if (
        date.format(PowerBackupData[0].CalibDate, "YYYY-MM-DD") !=
        currentdate &&
        currenttime > "07:00:00"
      ) {
        dayextendfordaily = true;
      }

      if (PowerBackupData[0].UserID != curruser) {
        //activitylog
        var objActivity = {};
        var userObj = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
        Object.assign(
          objActivity,
          { strUserId: userObj.UserId },
          {
            strUserName: userObj.UserName, //sarr_UserData[0].UserName
          },
          {
            activity: `Calibration discarded on IDS ${IdsNo} of User ${PowerBackupData[0].UserID}`,
          }
        );
        await objActivityLog.ActivityLogEntry(objActivity);

        //
      }

      if (
        PowerBackupData[0].UserID != curruser ||
        (dayextendfordaily &&
          (CalibrationType == "1" || CalibrationType == "4"))
      ) {
        console.log("calibpowerbakup discard sendcalib");
        await this.deleteCalibPowerBackupData(Calibrationname, IdsNo);

        //
        if (CalibrationType == "4" || CalibrationType == "1" || CalibrationType == "3") {
          return "DIFUSER";
        } else {
          // if (CalibrationType != "4" || CalibrationType != "1" || CalibrationType != "3") {
          const tempCubicInfo = globalData.arrIdsInfo.find(
            (k) => k.Sys_IDSNo == parseInt(IdsNo)
          );
          var objOwner = globalData.arrPreWeighCalibOwner.find(
            (k) => k.idsNo == parseInt(IdsNo)
          );
          var strBalId = tempCubicInfo.Sys_BalID;
          if (objOwner != undefined) {
            if (objOwner.owner == "analytical") {
              strBalId = tempCubicInfo.Sys_BalID;
            } else {
              strBalId = tempCubicInfo.Sys_BinBalID;
            }
          }


          // await this.movingtocalibfailaftercalibpowerbackupdiscard(
          //   CalibrationType,
          //   IdsNo
          // );

          var repnofordelete = await this.movingtocalibfailafterlogindifferrentUser(strBalId, IdsNo);

          switch (CalibrationType) {
            case "P": case "2":
              var selectRepSrNoObj = {
                str_tableName: "tbl_calibration_periodic_master_incomplete",
                data: "Periodic_RepNo",
                condition: [
                  { str_colName: "Periodic_BalID", value: strBalId, comp: "eq" },
                ],
              };
              var result = await database.select(selectRepSrNoObj);
              var int_periodic_RepNo = result[0][0].Periodic_RepNo;
              await comman.calibfailmovingallcalibrationentries("P", strBalId, int_periodic_RepNo, repnofordelete);
              break;

            case "E":
              var selectRepSrNoObj = {
                str_tableName: "tbl_calibration_eccentricity_master_incomplete",
                data: "Eccent_RepNo",
                condition: [
                  { str_colName: "Eccent_BalID", value: strBalId, comp: "eq" },
                ],
              };
              var result = await database.select(selectRepSrNoObj);
              var Eccent_RepNo = result[0][0].Eccent_RepNo;
              await comman.calibfailmovingallcalibrationentries("E", strBalId, Eccent_RepNo, repnofordelete);
              break;

            case "R":
              var selectRepSrNoObj = {
                str_tableName: "tbl_calibration_repetability_master_incomplete",
                data: "Repet_RepNo",
                condition: [
                  { str_colName: "Repet_BalID", value: strBalId, comp: "eq" },
                ],
              };
              var result = await database.select(selectRepSrNoObj);
              var Repet_RepNo = result[0][0].Repet_RepNo;
              await comman.calibfailmovingallcalibrationentries("R", strBalId, Repet_RepNo, repnofordelete);
              break;

            case "U":
              var selectRepSrNoObj = {
                str_tableName: "tbl_calibration_uncertinity_master_incomplete",
                data: "Uncertinity_RepNo",
                condition: [
                  {
                    str_colName: "Uncertinity_BalID",
                    value: strBalId,
                    comp: "eq",
                  },
                ],
              };
              var result = await database.select(selectRepSrNoObj);
              var Uncertinity_RepNo = result[0][0].Uncertinity_RepNo;
              await comman.calibfailmovingallcalibrationentries("U", strBalId, Uncertinity_RepNo, repnofordelete);
              break;
          }


          return "DIFUSER";
        }
        //
        // return "DIFUSER";

      }
      if (Calibrationname = "Periodic") {
        return `VI${CalibrationType}10Linearity,calibration pending,`;
      } else {
        return `VI${CalibrationType}10${Calibrationname},calibration pending,`;
      }

    } catch (err) {
      throw new Error(err);
    }
  }

  async sendCalibPowerBackupData(
    strReturnProtocol,
    PowerBackupData,
    IdsNo,
    str_IpAddress
  ) {
    try {
      var now = new Date();
      var currentdate = date.format(now, "YYYY-MM-DD");
      var Calibrationname = PowerBackupData[0].CalibrationType;
      const tempUserObject = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
      var curruser = tempUserObject.UserId;
      var calibtypeforipc = strReturnProtocol.substring(2, 3);
      var ipccalib = false;
      if (calibtypeforipc == "4" || calibtypeforipc == "5") {
        ipccalib = true;
      }
      const tempCubicInfo = globalData.arrIdsInfo.find(
        (k) => k.Sys_IDSNo == parseInt(IdsNo)
      );
      var objOwner = globalData.arrPreWeighCalibOwner.find(
        (k) => k.idsNo == parseInt(IdsNo)
      );
      var strBalId = tempCubicInfo.Sys_BalID;
      var calibtypee;
      if (objOwner != undefined) {
        if (objOwner.owner == "analytical") {
          strBalId = tempCubicInfo.Sys_BalID;
        } else {
          strBalId = tempCubicInfo.Sys_BinBalID;
        }
      }
      // var BalanceID = PowerBackupData[0].BalanceID;
      var CalibrationType = "";
      switch (Calibrationname) {
        case "Daily":
          if (ipccalib) {
            CalibrationType = "4";
          } else {
            CalibrationType = "1";
          }

          break;
        case "Periodic":
          if (ipccalib) {
            CalibrationType = "5";
          } else {
            CalibrationType = "2";
          }

          break;
        case "Eccentricity":
          CalibrationType = "E";
          break;
        case "Repeatability":
          CalibrationType = "R";
          break;
        case "Uncertainty":
          CalibrationType = "U";
          break;
        case "Vernier":
          CalibrationType = "3";
          break;
      }
      var dayextendfordaily = false;
      var dayextendforvernier = false;
      var currenttime = date.format(now, "HH:mm:ss");
      // if (
      //   (date.format(PowerBackupData[0].CalibDate, "YYYY-MM-DD") !=
      //     currentdate &&
      //     currenttime > "07:00:00")
      // ) {
      //   dayextendfordaily = true;
      //   dayextendforvernier = true;
      // }


      //
      // if (CalibrationType == "1" || CalibrationType == "4") {   //for discarding powerbackup of same day before 7 am 
      //   var selectRepSrNo = {
      //     str_tableName: "tbl_calibration_daily_master_incomplete",
      //     data: "*",
      //     condition: [
      //       { str_colName: "Daily_BalID", value: strBalId, comp: "eq" },
      //       { str_colName: "Daily_RepNo", value: PowerBackupData[0].Inc_RepSerNo, comp: "eq" },
      //     ],
      //   };

      //   // var entryFound = await database.select(selectRepSrNo);

      //   // if (entryFound[0].length > 0 &&
      //   //   (date.format(entryFound[0][0].Daily_CalbDate, "YYYY-MM-DD") == currentdate) &&
      //   //   (((entryFound[0][0].Daily_CalbTime).split(':')[0] < 7) && currenttime > "07:00:00")) {
      //   //   dayextendfordaily = true;
      //   // }

      // } else {
      //   if (CalibrationType == "3") {
      //     var selectRepSrNo = {
      //       str_tableName: "tbl_calibration_periodic_master_vernier_incomplete",
      //       data: "*",
      //       condition: [
      //         { str_colName: "Periodic_VerID", value: tempCubicInfo.Sys_VernierID, comp: "eq" },
      //         { str_colName: "Periodic_RepNo", value: PowerBackupData[0].Inc_RepSerNo, comp: "eq" },
      //       ],
      //     };
      //     // var entryFound = await database.select(selectRepSrNo);

      //     // if (entryFound[0].length > 0 &&
      //     //   (date.format(entryFound[0][0].Periodic_CalbDate, "YYYY-MM-DD") == currentdate) &&
      //     //   (((entryFound[0][0].Periodic_CalbTime).split(':')[0] < 7) && currenttime > "07:00:00")
      //     // ) {
      //     //   dayextendforvernier = true;
      //     // }
      //   }
      // }

      if (PowerBackupData[0].UserID != curruser) {
        //activitylog
        var objActivity = {};
        var userObj = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
        Object.assign(
          objActivity,
          { strUserId: userObj.UserId },
          {
            strUserName: userObj.UserName, //sarr_UserData[0].UserName
          },
          {
            activity: `Calibration discarded on IDS ${IdsNo} of User ${PowerBackupData[0].UserID}`,
          }
        );
        await objActivityLog.ActivityLogEntry(objActivity);
        //
      }

      if (PowerBackupData[0].UserID != curruser) {
        console.log("calibpowerbakup discard sendcalib");
        await this.deleteCalibPowerBackupData(Calibrationname, IdsNo);
        //
        if (
          CalibrationType != "4" &&
          CalibrationType != "1"
        ) {
          // await this.movingtocalibfailaftercalibpowerbackupdiscard(
          //   CalibrationType,
          //   IdsNo
          // );
          var repnofordelete = await this.movingtocalibfailafterlogindifferrentUser(strBalId, IdsNo);
          switch (CalibrationType) {
            case "P": case "2":
              var selectRepSrNoObj = {
                str_tableName: "tbl_calibration_periodic_master_incomplete",
                data: 'MAX(Periodic_RepNo) AS Periodic_RepNo',

                condition: [
                  { str_colName: "Periodic_BalID", value: strBalId, comp: "eq" },
                ],
              };
              var result = await database.select(selectRepSrNoObj);
              var int_periodic_RepNo = result[0][0].Periodic_RepNo;
              await comman.calibfailmovingallcalibrationentries("P", strBalId, int_periodic_RepNo, repnofordelete);
              break;

            case "E":
              var selectRepSrNoObj = {
                str_tableName: "tbl_calibration_eccentricity_master_incomplete",
                data: 'MAX(Eccent_RepNo) AS Eccent_RepNo',
                condition: [
                  { str_colName: "Eccent_BalID", value: strBalId, comp: "eq" },
                ],
              };
              var result = await database.select(selectRepSrNoObj);
              var Eccent_RepNo = result[0][0].Eccent_RepNo;
              await comman.calibfailmovingallcalibrationentries("E", strBalId, Eccent_RepNo, repnofordelete);
              break;

            case "R":
              var selectRepSrNoObj = {
                str_tableName: "tbl_calibration_repetability_master_incomplete",
                data: 'MAX(Repet_RepNo) AS Repet_RepNo',
                condition: [
                  { str_colName: "Repet_BalID", value: strBalId, comp: "eq" },
                ],
              };
              var result = await database.select(selectRepSrNoObj);
              var Repet_RepNo = result[0][0].Repet_RepNo;
              await comman.calibfailmovingallcalibrationentries("R", strBalId, Repet_RepNo, repnofordelete);
              break;
            case "U":
              var selectRepSrNoObj = {
                str_tableName: "tbl_calibration_uncertinity_master_incomplete",
                data: 'MAX(Uncertinity_RepNo) AS Uncertinity_RepNo',
                condition: [
                  {
                    str_colName: "Uncertinity_BalID",
                    value: strBalId,
                    comp: "eq",
                  },
                ],
              };

              var result = await database.select(selectRepSrNoObj);
              var Uncertinity_RepNo = result[0][0].Uncertinity_RepNo;
              await comman.calibfailmovingallcalibrationentries("U", strBalId, Uncertinity_RepNo, repnofordelete);
              break;
          }
          console.log(
            "Incomplete entry moved due to different user login" + IdsNo
          );
        }
        else {
          if (CalibrationType == "1" || CalibrationType == "4") {
            var changeInprocessFlag = {
              str_tableName: "tbl_calibration_daily_master_incomplete",
              data: [
                { str_colName: "Inprocess", value: 0 },
              ],
              condition: [
                { str_colName: "Daily_BalID", value: strBalId, comp: "eq" },
                { str_colName: "Daily_RepNo", value: PowerBackupData[0].Inc_RepSerNo, comp: "eq" },
              ],
            };
            await database.update(changeInprocessFlag);
          } else if (CalibrationType == "3") {
            var changeInprocessFlag = {
              str_tableName: "tbl_calibration_periodic_master_vernier_incomplete",
              data: [
                { str_colName: "Inprocess", value: 0 },
              ],
              condition: [
                { str_colName: "Periodic_VerID", value: tempCubicInfo.Sys_VernierID, comp: "eq" },
                { str_colName: "Periodic_RepNo", value: PowerBackupData[0].Inc_RepSerNo, comp: "eq" },
              ],
            };
          }
        }
        return "DIFUSER";
      }
      switch (CalibrationType) {
        case "1":
          calibtypee = "daily";
          break;
        case "2":
          calibtypee = "periodic";
          break;
        case "E":
          calibtypee = "eccentricity";
          break;
        case "R":
          calibtypee = "repeatability";
          break;
        case "U":
          calibtypee = "uncertinity";
          break;
        case "3":
          calibtypee = "vernierPeriodic";
          break;
      }
      globalData.arrcalibType.push({ idsNo: IdsNo, calibType: calibtypee });
      if (Calibrationname == "Periodic") {
        return `VI${CalibrationType}1Linearity,calibration pending,,,`;
      } else {
        return `VI${CalibrationType}1${Calibrationname},calibration pending,,,`;
      }
    } catch (err) {
      throw new Error(err);
    }
  }



  async movingtocalibfailaftercalibpowerbackupdiscard_OLD(CalibrationType, IdsNo) {
    const tempCubicInfo = globalData.arrIdsInfo.find(
      (k) => k.Sys_IDSNo == parseInt(IdsNo)
    );
    var objOwner = globalData.arrPreWeighCalibOwner.find(
      (k) => k.idsNo == parseInt(IdsNo)
    );
    var strBalId = tempCubicInfo.Sys_BalID;
    if (objOwner != undefined) {
      if (objOwner.owner == "analytical") {
        strBalId = tempCubicInfo.Sys_BalID;
      } else {
        strBalId = tempCubicInfo.Sys_BinBalID;
      }
    }

    switch (CalibrationType) {
      case "2":
      case "5":
        var selectRepSrNoObj = {
          str_tableName: "tbl_calibration_periodic_master_incomplete",
          data: "Periodic_RepNo",
          condition: [
            { str_colName: "Periodic_BalID", value: strBalId, comp: "eq" },
          ],
        };
        var result = await database.select(selectRepSrNoObj);
        if (result[0][0] != undefined) {
          var int_periodic_RepNo = result[0][0].Periodic_RepNo;

          await comman.caibrationFails("P", strBalId, int_periodic_RepNo);
        }
        break;

      case "E":
        var selectRepSrNoObj = {
          str_tableName: "tbl_calibration_eccentricity_master_incomplete",
          data: "Eccent_RepNo",
          condition: [
            { str_colName: "Eccent_BalID", value: strBalId, comp: "eq" },
          ],
        };
        var result = await database.select(selectRepSrNoObj);
        if (result[0][0] != undefined) {
          var Eccent_RepNo = result[0][0].Eccent_RepNo;
          await comman.caibrationFails("E", strBalId, Eccent_RepNo);
        }
        break;

      case "R":
        var selectRepSrNoObj = {
          str_tableName: "tbl_calibration_repetability_master_incomplete",
          data: "Repet_RepNo",
          condition: [
            { str_colName: "Repet_BalID", value: strBalId, comp: "eq" },
          ],
        };
        var result = await database.select(selectRepSrNoObj);
        if (result[0][0] != undefined) {
          var Repet_RepNo = result[0][0].Repet_RepNo;
          await comman.caibrationFails("R", strBalId, Repet_RepNo);
        }
        break;

      case "U":
        console.log("deletewrong");
        var selectRepSrNoObj = {
          str_tableName: "tbl_calibration_uncertinity_master_incomplete",
          data: "Uncertinity_RepNo",
          condition: [
            { str_colName: "Uncertinity_BalID", value: strBalId, comp: "eq" },
          ],
        };
        var result = await database.select(selectRepSrNoObj);
        if (result[0][0] != undefined) {
          var Uncertinity_RepNo = result[0][0].Uncertinity_RepNo;
          await comman.caibrationFails("U", strBalId, Uncertinity_RepNo);
        }
        break;
    }
    // return "ok";
  }
  async movingtocalibfailaftercalibpowerbackupdiscard(CalibrationType, IdsNo) {
    console.log("movingtocalibfailaftercalibpowerbackupdiscard");
    const tempCubicInfo = globalData.arrIdsInfo.find(
      (k) => k.Sys_IDSNo == parseInt(IdsNo)
    );
    var objOwner = globalData.arrPreWeighCalibOwner.find(
      (k) => k.idsNo == parseInt(IdsNo)
    );
    var strBalId = tempCubicInfo.Sys_BalID;
    if (objOwner != undefined) {
      if (objOwner.owner == "analytical") {
        strBalId = tempCubicInfo.Sys_BalID;
      } else {
        strBalId = tempCubicInfo.Sys_BinBalID;
      }
    }

    switch (CalibrationType) {
      case "1":
        CalibrationType = "Daily";
        break;
      case "2":
        CalibrationType = "Periodic";
        break;
      case "E":
        CalibrationType = "Eccentricity";
        break;
      case "R":
        CalibrationType = "Repeatability";
        break;
      case "U":
        CalibrationType = "Uncertainty";
        break;
    }


    var repnofordelete = await this.movingtocalibfailafterlogindifferrentUser(
      strBalId,
      IdsNo
    );
    await this.moving_incomplete_calib_entry_whose_flag_zero(CalibrationType, strBalId, repnofordelete);
    // return "ok";
  }
  async deletepowerbackupaftercalibterminated(IdsNo) {
    console.log("deletepowerbackupaftercalibterminated");
    const tempCubicInfo = globalData.arrIdsInfo.find(
      (k) => k.Sys_IDSNo == parseInt(IdsNo)
    );
    var objOwner = globalData.arrPreWeighCalibOwner.find(
      (k) => k.idsNo == parseInt(IdsNo)
    );
    var strBalId = tempCubicInfo.Sys_BalID;
    var strVerid = tempCubicInfo.Sys_VernierID;
    if (objOwner != undefined) {
      if (objOwner.owner == "analytical") {
        strBalId = tempCubicInfo.Sys_BalID;
      } else {
        strBalId = tempCubicInfo.Sys_BinBalID;
      }
    }

    var selectCalibPowerBackupData = {
      str_tableName: "tbl_calibpowerbackup",
      data: "*",
      condition: [
        { str_colName: "IdsNo", value: IdsNo },
        { str_colName: "BalanceID", value: strBalId },
      ],
    };
    var result = await database.select(selectCalibPowerBackupData);
    if (result[0].length > 0) {
      var deleteObj = {
        str_tableName: "tbl_calibpowerbackup",
        condition: [
          { str_colName: "IdsNo", value: IdsNo },
          { str_colName: "BalanceID", value: strBalId },
        ],
      };
      console.log("calibpowerbakup discard  AFTER LO");

      await database.delete(deleteObj);

      var CalibrationType = result[0][0].CalibrationType;
      //ACTIVITYLOG
      var objActivity = {};
      var userObj = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
      var activityofcalibname = CalibrationType;
      // if (activityofcalibname == "Periodic") {
      //   // activityofcalibname = "Linearity";
      // }
      Object.assign(
        objActivity,
        { strUserId: userObj.UserId },
        {
          strUserName: userObj.UserName, //sarr_UserData[0].UserName
        },
        { activity: `${activityofcalibname}  Calibration Discarded on IDS ` + IdsNo }
      );
      await objActivityLog.ActivityLogEntry(objActivity);
      //

      switch (CalibrationType) {
        case "Daily":
          CalibrationType = "1";
          break;
        case "Periodic":
          CalibrationType = "2";
          break;
        case "Vernier":
          CalibrationType = "3";
          break;
        case "Eccentricity":
          CalibrationType = "E";
          break;
        case "Repeatability":
          CalibrationType = "R";
          break;
        case "Uncertainty":
          CalibrationType = "U";
          break;
      }

      if (CalibrationType != "D" && CalibrationType != "1" && CalibrationType != "3") {
        var repnofordelete = await this.movingtocalibfailafterlogindifferrentUser(
          strBalId,
          IdsNo
        );
        // if (activityofcalibname == "Linearity") {
          // activityofcalibname = "Periodic";
        // }
        await this.moving_incomplete_calib_entry_whose_flag_zero(activityofcalibname, strBalId, repnofordelete);

      }
    } else {
      var selectCalibPowerBackupData1 = {
        str_tableName: "tbl_calibpowerbackup",
        data: "*",
        condition: [
          { str_colName: "IdsNo", value: IdsNo },
          { str_colName: "BalanceID", value: strVerid },
        ],
      };
      var result1 = await database.select(selectCalibPowerBackupData1);
      if (result1[0].length > 0) {
        var deleteObj = {
          
          str_tableName: "tbl_calibpowerbackup",
          condition: [
            { str_colName: "IdsNo", value: IdsNo },
            { str_colName: "BalanceID", value: strVerid },
          ],
        };
        console.log("calibpowerbakup discard  AFTER LO");

        await database.delete(deleteObj);

        var CalibrationType = result1[0][0].CalibrationType;
        var activityofcalibname = CalibrationType;
        // if (activityofcalibname == "Periodic") {
        //   activityofcalibname = "Linearity";
        // }
        //ACTIVITYLOG
        var objActivity = {};
        var userObj = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
        Object.assign(
          objActivity,
          { strUserId: userObj.UserId },
          {
            strUserName: userObj.UserName,
          },
          { activity: `${activityofcalibname}  Calibration Discarded on IDS ` + IdsNo }
        );
        await objActivityLog.ActivityLogEntry(objActivity);
        //
      }
    }
    return "ok";
  }

  async movingtocalibfailafterlogindifferrentUser(strBalId, IdsNo, Ipc_flag = false) {
    // var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatus.find(
    //   (k) => k.Bal_ID == strBalId
    // );
    console.log("movingtocalibfailafterlogindifferrentUser");
    await this.pushCalibrationObj(strBalId, IdsNo, Ipc_flag);
    var tempCalibStatus = globalData.calibrationStatus.find(
      (k) => k.BalId == strBalId
    );

    var sortedArray = await sort.sortedSeqArray(
      globalData.arrSortedCalib,
      strBalId
    );

    // var int_curentCalibrationIndex = sortedArray.indexOf(CalibrationType);
    var str_first_calibration = sortedArray[0];
    var fRerSrNo = await comman.getFrepSrNo(str_first_calibration);
    // fRerSrNo is failed repSrNo which will insert   in all failed tables
    if (tempCalibStatus != undefined) {
      var count = 0;

      for (var i in tempCalibStatus.status) {
        if (tempCalibStatus.status[i] == 1) {
          count = count + 1;
        }
      }
      var arr_CalibArray = []; // array holds calibration which done and one which failed
      for (let i = 0; i < count; i++) {
        arr_CalibArray.push(sortedArray[i]);
      }


      if (arr_CalibArray.length > 0) {
        //
        for (let i = 0; i < arr_CalibArray.length; i++) {
          switch (arr_CalibArray[i]) {
            case "P":
              var selectRepSrNoObj = {
                str_tableName: "tbl_calibration_periodic_master_incomplete",
                data: 'MAX(Periodic_RepNo) AS Periodic_RepNo',
                condition: [
                  { str_colName: "Periodic_BalID", value: strBalId, comp: "eq" },
                ],
              };
              var result = await database.select(selectRepSrNoObj);
              var int_periodic_RepNo = result[0][0].Periodic_RepNo;
              await comman.calibfailmovingallcalibrationentries("P", strBalId, int_periodic_RepNo, fRerSrNo);
              break;

            case "E":
              var selectRepSrNoObj = {
                str_tableName: "tbl_calibration_eccentricity_master_incomplete",
                data: 'MAX(Eccent_RepNo) AS Eccent_RepNo',
                condition: [
                  { str_colName: "Eccent_BalID", value: strBalId, comp: "eq" },
                ],
              };
              var result = await database.select(selectRepSrNoObj);
              var Eccent_RepNo = result[0][0].Eccent_RepNo;
              await comman.calibfailmovingallcalibrationentries("E", strBalId, Eccent_RepNo, fRerSrNo);
              break;
            case "R":
              var selectRepSrNoObj = {
                str_tableName: "tbl_calibration_repetability_master_incomplete",
                data: 'MAX(Repet_RepNo) AS Repet_RepNo',

                condition: [
                  { str_colName: "Repet_BalID", value: strBalId, comp: "eq" },
                ],
              };
              var result = await database.select(selectRepSrNoObj);
              var Repet_RepNo = result[0][0].Repet_RepNo;
              await comman.calibfailmovingallcalibrationentries("R", strBalId, Repet_RepNo, fRerSrNo);
              break;

            case "U":
              var selectRepSrNoObj = {
                str_tableName: "tbl_calibration_uncertinity_master_incomplete",
                data: 'MAX(Uncertinity_RepNo) AS Uncertinity_RepNo',

                condition: [
                  {
                    str_colName: "Uncertinity_BalID",
                    value: strBalId,
                    comp: "eq",
                  },
                ],
              };
              var result = await database.select(selectRepSrNoObj);
              var Uncertinity_RepNo = result[0][0].Uncertinity_RepNo;
              await comman.calibfailmovingallcalibrationentries("U", strBalId, Uncertinity_RepNo, fRerSrNo);
              break;
          }
        }


        // await comman.UpdateRecalibFLagPeriodic(strBalId, IdsNo);
        // BalanceRecalibStatusObject.PeriodicBalRecalib = 0;
        var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IdsNo);
        if (Ipc_flag) {
          var calibTable = 'tbl_calibration_status_bin';
        } else {
          //   var calibTable = 'tbl_calibration_status';
          // }
          // var calibTable = 'tbl_calibration_status';
          if (objOwner.owner == 'analytical') {
            var calibTable = 'tbl_calibration_status';
          } else {
            var calibTable = 'tbl_calibration_status_bin';
          }
        }

        const updateCalibstatusObj = {
          str_tableName: calibTable,
          data: [
            { str_colName: "P", value: 0 },
            { str_colName: "U", value: 0 },
            { str_colName: "R", value: 0 },
            { str_colName: "E", value: 0 },


          ],
          condition: [{ str_colName: "BalID", value: strBalId }],
        };
        await database.update(updateCalibstatusObj);
        for (var i in globalData.calibrationStatus) {
          if (globalData.calibrationStatus[i].BalId == strBalId) {
            globalData.calibrationStatus[i].status["P"] = 0;
            globalData.calibrationStatus[i].status["U"] = 0;
            globalData.calibrationStatus[i].status["R"] = 0;
            globalData.calibrationStatus[i].status["E"] = 0;
            break; //Stop this loop, we found it!
          }
        }
      }
      return fRerSrNo;
    }
    return fRerSrNo;
  }

  async moving_incomplete_calib_entry_whose_flag_zero(CalibrationType, balance, repnofordelete) {
    console.log("moving_incomplete_calib_entry_whose_flag_zero");
    switch (CalibrationType) {
      case "Periodic":
        var selectRepSrNoObj = {
          str_tableName: "tbl_calibration_periodic_master_incomplete",
          data: 'MAX(Periodic_RepNo) AS Periodic_RepNo',
          condition: [
            {
              str_colName: "Periodic_BalID",
              value: balance,
              comp: "eq",
            },
          ],
        };
        var result = await database.select(selectRepSrNoObj);
        var int_periodic_RepNo = result[0][0].Periodic_RepNo;
        await comman.calibfailmovingallcalibrationentries(
          "P",
          balance,
          int_periodic_RepNo,
          repnofordelete
        );

        break;

      case "Eccentricity":
        var selectRepSrNoObj = {
          str_tableName:
            "tbl_calibration_eccentricity_master_incomplete",
          data: 'MAX(Eccent_RepNo) AS Eccent_RepNo',
          condition: [
            {
              str_colName: "Eccent_BalID",
              value: balance,
              comp: "eq",
            },
          ],
        };
        var result = await database.select(selectRepSrNoObj);
        var Eccent_RepNo = result[0][0].Eccent_RepNo;
        await comman.calibfailmovingallcalibrationentries(
          "E",
          balance,
          Eccent_RepNo,
          repnofordelete
        );
        break;

      case "Repeatability":
        var selectRepSrNoObj = {
          str_tableName:
            "tbl_calibration_repetability_master_incomplete",
          data: 'MAX(Repet_RepNo) AS Repet_RepNo',

          condition: [
            {
              str_colName: "Repet_BalID",
              value: balance,
              comp: "eq",
            },
          ],
        };
        var result = await database.select(selectRepSrNoObj);
        var Repet_RepNo = result[0][0].Repet_RepNo;
        await comman.calibfailmovingallcalibrationentries(
          "R",
          balance,
          Repet_RepNo,
          repnofordelete
        );
        break;

      case "Uncertainty":
        var selectRepSrNoObj = {
          str_tableName:
            "tbl_calibration_uncertinity_master_incomplete",
          data: 'MAX(Uncertinity_RepNo) AS Uncertinity_RepNo',
          condition: [
            {
              str_colName: "Uncertinity_BalID",
              value: balance,
              comp: "eq",
            },
          ],
        };
        var result = await database.select(selectRepSrNoObj);
        var Uncertinity_RepNo = result[0][0].Uncertinity_RepNo;
        await comman.calibfailmovingallcalibrationentries(
          "U",
          balance,
          Uncertinity_RepNo,
          repnofordelete
        );
        break;
    }
  }

  async pushCalibrationObj(strBalId, IDSSrNo, Ipc_flag = false) {
    try {
      var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IDSSrNo);
      if (Ipc_flag) {
        var calibTable = 'tbl_calibration_status_bin';
      } else {
        //   var calibTable = 'tbl_calibration_status';
        // }
        if (objOwner.owner == 'analytical') {
          var calibTable = 'tbl_calibration_status';
        } else {
          var calibTable = 'tbl_calibration_status_bin';
        }
      }
      var selectCalibObj = {
        str_tableName: calibTable,
        data: '*',
        condition: [
          { str_colName: 'BalID', value: strBalId, comp: 'eq' },
        ]
      }
      var result = await database.select(selectCalibObj)

      const tempObj = {
        P: result[0][0].P.readUIntLE(),
        E: result[0][0].E.readUIntLE(),
        R: result[0][0].R.readUIntLE(),
        U: result[0][0].U.readUIntLE(),
        L: result[0][0].L.readUIntLE(),
        V: result[0][0].V.readUIntLE()
      }
      var objFound = globalData.calibrationStatus.find(k => k.BalId == strBalId);
      if (objFound == undefined) {
        globalData.calibrationStatus.push({ BalId: strBalId, status: tempObj });
      } else {
        objFound.BalId = strBalId;
        objFound.status = tempObj;
      }
      return 0;
    } catch (err) {
      throw new Error(err);
    }
  }
}
module.exports = CalibPowerBackup;
CalibPowerBackup