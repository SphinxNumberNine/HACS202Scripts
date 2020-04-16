const child_process = require("child_process");
const fs = require("fs");
const sleep = require("util").promisify(setTimeout);

const containerID = 101;
const containerPort = 10000;
const containerIP = "172.20.0.123";
const scrambleLevel = "all";

const createContainer = () => {
  const createCommand =
    "pct create " +
    containerID +
    " local:vztmpl/ubuntu-16.04-standard_16.04.5-1_amd64.tar.gz --storage local-lvm --net0 name=eth0,bridge=vmbr0,ip=172.20.0.123/16,gw=172.20.0.1 --cores 1 --memory 4096 --swap 0";

  let creationResponse = child_process.spawnSync(createCommand);

  if (creationResponse.error) {
    return false;
  }

  return true;
};

const mountContainer = () => {
  const mountCommand = "pct mount " + containerID;

  let mountResponse = child_process.spawnSync(mountCommand);

  if (mountCommand.error) {
    return false;
  }

  return true;
};

const execMITM = () => {
  let scrambleScript;
  if (scrambleLevel === "all") {
    scrambleScript = "scramble_all.js";
  } else if (scrambleLevel === "half") {
    scrambleScript = "scramble_half.js";
  } else if ((scrambleLevel = "impossible")) {
    scrambleScript = "impossible.js";
  } else {
    scrambleScript = "control.js";
  }

  const mitmCommand =
    "node mitm/index.js HACS202_B " +
    containerPort +
    " " +
    containerIP +
    " " +
    containerID +
    " true " +
    scrambleScript;

  let mitmResponse = child_process.spawnSync(mitmCommand);

  if (mitmResponse.error) {
    return false;
  }

  return true;
};

const scanLoginsFile = async () => {
  const loginsPath = "~/MITM_data/logins " + containerID + ".txt";

  let loginsFileBuffer = fs.readFileSync(loginsPath);
  const previousBufferSize = loginsFileBuffer.byteLength;
  let newBufferSize = -1;

  while (newBufferSize != previousBufferSize) {
    loginsFileBuffer = fs.readFileSync(loginsPath);
    newBufferSize = loginsFileBuffer.byteLength;

    await sleep(5000);
  }

  return true;
};

const waitForAttacker = async () => {
  await sleep(1000 * 60 * 30);
};

const destroyContainer = () => {
  const stopCommand = "pct stop " + containerID;
  const destroyCommand = "pct destroy " + containerID;

  const stopResponse = child_process.spawnSync(stopCommand);
  if (stopResponse.error) {
    return false;
  }

  const destroyResponse = child_process.spawnSync(destroyCommand);
  if (destroyResponse.error) {
    return false;
  }
};

const doLifecycle = () => {
  while (1 == 1) {
    createContainer();
    mountContainer();
    execMITM();
    scanLoginsFile();
    waitForAttacker();
    destroyContainer();
  }
};

doLifecycle();
