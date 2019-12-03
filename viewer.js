/*
 * Copyright (C) 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Fill in all the values between the hash marks
// #############################################
const CLIENT_ID = 'INSERT-YOUR-CLIENT-ID-HERE'
// #############################################

const CLOUD_HEALTHCARE_API_BASE =
    'https://healthcare.googleapis.com/v1beta1/projects/';
const SCOPE = 'https://www.googleapis.com/auth/cloud-healthcare';
const STUDIES_PATH = '/studies';
const SERIES_PATH = '/series';

// The following are all attributes and tags from the DICOM standard
// A constant's name describes the attribute. The value is the stringified,
// non-comma-separated tag associated with it.
const COLUMN_POSITION_TAG = '0048021E';
const COLUMNS_TAG = '00280011';  // Number of columns in the image
// Per-frame Functional Groups Sequence
const FUNCTIONAL_GROUP_SEQUENCE_TAG = '52009230';
const PLANE_POSITION_SEQUENCE_TAG = '0048021A';  // Plane Position Sequence
const ROW_POSITION_TAG = '0048021F';
const ROWS_TAG = '00280010';  // Number of rows in the image
const SERIES_INSTANCE_UID_TAG = '0020000E';
const SOP_INSTANCE_UID_TAG = '00080018';
// Unique identifier for the Series that is part of the Study
const STUDY_INSTANCE_UID_TAG = '0020000D';
// Total number of columns in pixel matrix
const TOTAL_PIXEL_MATRIX_COLUMNS_TAG = '00480006';
// Total number of rows in pixel matrix
const TOTAL_PIXEL_MATRIX_ROWS_TAG = '00480007';

let viewer = null;
let updatedDicomUrl = CLOUD_HEALTHCARE_API_BASE;
let googleAuth = null;

/**
 * Generate ajax call url for QIDO request.
 * @param {string} path The path to dicom resource relative to dicomWeb
 *     endpoint.
 * @return {string} Complete url for http request.
 */
function toDicomWebQIDOUrl(path) {
  return updatedDicomUrl + path + '?includefield=all&access_token=' +
      googleAuth.currentUser.get().getAuthResponse(true).access_token;
}

/**
 * Generate ajax call url for WADO request.
 * @param {string} path The path to dicom resource relative to dicomWeb
 *     endpoint.
 * @return {string} Complete url for http request.
 */
function toDicomWebWADOUrl(path) {
  return updatedDicomUrl + path + '?access_token=' +
      googleAuth.currentUser.get().getAuthResponse(true).access_token;
}

/**
 * Load all locations.
 */
function loadLocations() {
  const projectId = document.getElementById("project").value;
  if(projectId == undefined || projectId.length < 1) {
    alert('Error: Please input Project Id.');
    return;
  }
  updatedDicomUrl = CLOUD_HEALTHCARE_API_BASE + projectId +'/locations';
  $.ajax({
    url: toDicomWebWADOUrl(''),
    error: function(jqXHR) {
      alert(
          'Error - retrieving location failed: ' +
          jqXHR.responseJSON[0].error.code + ' ' +
          jqXHR.responseJSON[0].error.message);
    },
    success: function(locationsJson) {
      $('#locations-select').empty();
      $('#datasets-select').empty();
      $('#stores-select').empty();
      $('#studies-select').empty();
      const select = document.getElementById("locations-select");
      const defaultOption = document.createElement('option');
      defaultOption.innerText = 'Please select location.';
      defaultOption.value = '';
      select.appendChild(defaultOption);

      for (let i = 0; i < locationsJson['locations'].length; i++) {
        const location = (locationsJson['locations'][i].locationId);
        const option = document.createElement('option');
        option.innerText = location;
        option.value = location;
        select.appendChild(option);
      }
    }
  });
}

/**
 * Load all Dicom stores.
 * @param {Object!} selectLocation Selected location object, value is the
 *  selected location.
 */
function loadDatasets(selectLocation) {
  const location = selectLocation.value;
  if(location.length == 0) return;
  const pathToDatasets = '/' + location + '/datasets';
  $.ajax({
    url: toDicomWebWADOUrl(pathToDatasets),
    error: function(jqXHR) {
      alert(
          'Error - retrieving dataset failed: ' +
          jqXHR.responseJSON[0].error.code + ' ' +
          jqXHR.responseJSON[0].error.message);
    },
    success: function(datasetsJson) {
      $('#datasets-select').empty();
      $('#stores-select').empty();
      $('#studies-select').empty();
      const select = document.getElementById("datasets-select");
      const defaultOption = document.createElement('option');
      defaultOption.innerText = 'Please select datasets.';
      defaultOption.value = '';
      select.appendChild(defaultOption);

      for (let i = 0; i < datasetsJson['datasets'].length; i++) {
        const dataset = (datasetsJson['datasets'][i].name).split("/").pop();
        const option = document.createElement('option');
        option.innerText = dataset;
        option.value = pathToDatasets + '/' + dataset;
        select.appendChild(option);
      }
    }
  });
}

/**
 * Load all Dicom stores.
 * @param {Object!} selectPathToDatasets Selected dataset object, value is the
 *  path to selected dataset.
 */
function loadDicomStores(selectPathToDatasets) {
  const pathToDatasets = selectPathToDatasets.value;
  if(pathToDatasets.length == 0) return;
  const pathToDicomStores = pathToDatasets + '/dicomStores';
  $.ajax({
    url: toDicomWebWADOUrl(pathToDicomStores),
    error: function(jqXHR) {
      alert(
          'Error - retrieving Dicom Store failed: ' +
          jqXHR.responseJSON[0].error.code + ' ' +
          jqXHR.responseJSON[0].error.message);
    },
    success: function(dicomStoresJson) {
      $('#stores-select').empty();
      $('#studies-select').empty();
      const select = document.getElementById("stores-select");
      const defaultOption = document.createElement('option');
      defaultOption.innerText = 'Please select dataStores.';
      defaultOption.value = '';
      select.appendChild(defaultOption);

      for (let i = 0; i < dicomStoresJson['dicomStores'].length; i++) {
        const dicomStore = (dicomStoresJson['dicomStores'][i].name).split("/").pop();
        const option = document.createElement('option');
        option.innerText = dicomStore;
        option.value = pathToDicomStores + '/' + dicomStore;
        select.appendChild(option);
      }
    }
  });
}

/**
 * Load all studies of give dicomStore.
 * @param {Object!} selectPathToDicomStore Selected dicomStore object, value is
 *  the path to selected dicom store.
 */
function loadStudies(selectPathToDicomStore) {
  const pathToDicomStore = selectPathToDicomStore.value;
  if(pathToDicomStore.length == 0) return;
  const pathToDicomStudies = pathToDicomStore + '/dicomWeb' + STUDIES_PATH;
  $.ajax({
    url: toDicomWebQIDOUrl(pathToDicomStudies),
    error: function(jqXHR) {
      alert(
          'Error - retrieving study failed: ' +
          jqXHR.responseJSON[0].error.code + ' ' +
          jqXHR.responseJSON[0].error.message);
    },
    success: function(studiesArray) {
      $('#studies-select').empty();
      const select = document.getElementById("studies-select");
      const defaultOption = document.createElement('option');
      defaultOption.innerText = 'Please select studies.';
      defaultOption.value = '';
      select.appendChild(defaultOption);

      for (let i = 0; i < studiesArray.length; i++) {
        const option = document.createElement('option');
        option.innerText = 'Study' + (i + 1);
        option.value = pathToDicomStudies + '/'
            + studiesArray[i][STUDY_INSTANCE_UID_TAG].Value[0];
        select.appendChild(option);
      }
    }
  });
}

/**
 * Load instances in a single study, create view if not present, refresh view if
 * already present.
 * @param {string} selectPathToStudy Selected study object, value is the
 *  path to selected study.
 */
function loadInstancesInStudy(selectPathToStudy) {
  const pathToStudy = selectPathToStudy.value;
  if(pathToStudy.length == 0) return;
  const seriesPath = pathToStudy + SERIES_PATH;
  $.ajax({
    url: toDicomWebQIDOUrl(seriesPath),
    error: function(jqXHR) {
      alert(
          'Error - retrieving series failed: ' +
          jqXHR.responseJSON[0].error.code + ' ' +
          jqXHR.responseJSON[0].error.message);
    },
    success: function(series) {
      const instancesPath = seriesPath + '/' +
          series[0][SERIES_INSTANCE_UID_TAG].Value[0] + '/instances';
      $.ajax({
        url: toDicomWebQIDOUrl(instancesPath),
        error: function(jqXHR) {
          alert(
              'Error - retrieving instances failed: ' +
              jqXHR.responseJSON[0].error.code + ' ' +
              jqXHR.responseJSON[0].error.message);
        },
        success: function(instances) {
          try {
            let maxWidthPx = 0;
            let maxHeightPx = 0;
            let tileWidthPx = 0;
            let tileHeightPx = 0;
            let levelWidths = new Set();

            for (let i = 0; i < instances.length; i++) {
              const w =
                  Number(instances[i][TOTAL_PIXEL_MATRIX_COLUMNS_TAG].Value);
              levelWidths.add(w);
              const h = Number(instances[i][TOTAL_PIXEL_MATRIX_ROWS_TAG].Value);

              if (w > maxWidthPx) {
                maxWidthPx = w;
              }
              if (h > maxHeightPx) {
                maxHeightPx = h;
              }
              tileWidthPx = Number(instances[i][COLUMNS_TAG].Value);
              tileHeightPx = Number(instances[i][ROWS_TAG].Value);
            }
            const sortedLevelWidths = Array.from(levelWidths.values());
            sortedLevelWidths.sort((a, b) => b - a);

            const countLevels = levelWidths.size;
            // Compute pyramid cache
            // Map of "x,y,z" => {SOPInstanceUID, Frame No.}
            const pyramidMeta =
                calculatePyramidMeta(instances, sortedLevelWidths);

            tileSource = {
              height: maxHeightPx,
              width: maxWidthPx,
              tileSize: tileWidthPx,
              maxLevel: countLevels - 1,
              minLevel: 0,
              getTileUrl: function(level, row, col) {
                const x = 1 + (tileWidthPx * row);
                const y = 1 + (tileHeightPx * col);
                const z = countLevels - 1 - level;
                const key = x + '/' + y + '/' + z;
                const params = pyramidMeta[key];
                return toDicomWebWADOUrl(
                    instancesPath + '/' + params.SOPInstanceUID + '/frames/' +
                    params.FrameNumber + '/rendered');
              },
              getLevelScale: function(level) {
                return sortedLevelWidths[countLevels - 1 - level] / maxWidthPx;
              }
            };

            if (viewer == null) {
              viewer = OpenSeadragon({
                id: 'openseadragon',
                prefixUrl: `https://cdn.jsdelivr.net/npm/openseadragon@2.4/build/openseadragon/images/`,
                navigatorSizeRatio: 0.25,
                loadTilesWithAjax: true,
                ajaxHeaders: {
                  Accept: 'image/jpeg',
                },
                tileSources: tileSource,
              });
            } else {
              viewer.close();
              viewer.open(tileSource);
            }
          } catch (err) {
            alert(
                `Could not parse DICOM for study, possible reason: DICOM is not
                pathology or damaged image.`);
          }
        }
      });
    }
  });
}

/**
 * Calculate image pyramid metadata.
 * @param {array!} dicomInstances Instances of dicom image.
 * @param {array!} sortedLevelWidths Sorted level widths array.
 * @return {Object!} Image pyramid metadata.
 */
function calculatePyramidMeta(dicomInstances, sortedLevelWidths) {
  let widthToLevelMap = {};
  for (let i = 0; i < sortedLevelWidths.length; i++) {
    widthToLevelMap[sortedLevelWidths[i]] = i;
  }

  let pyramidMeta = {};
  for (let i = 0; i < dicomInstances.length; i++) {
    const sopInstanceUID = dicomInstances[i][SOP_INSTANCE_UID_TAG].Value;
    const frameMeta = dicomInstances[i][FUNCTIONAL_GROUP_SEQUENCE_TAG].Value;

    for (let j = 0; j < frameMeta.length; j++) {
      const frameNumber = j + 1;

      // For (x,y) should actually use
      // FrameContentSequence.DimensionIndexValues which an array of
      // size 2 with [x, y]. The below are pixel values and need to be
      // diveded by frameWidth/frameHeight.
      // PerFrameFunctionalGroupsSequence.PlanePositionSlideSequence.ColumnPositionInTotalImagePixelMatrix
      const x = frameMeta[j][PLANE_POSITION_SEQUENCE_TAG]
                    .Value[0][COLUMN_POSITION_TAG]
                    .Value;
      // PerFrameFunctionalGroupsSequence.PlanePositionSlideSequence.RowPositionInTotalImagePixelMatrix
      const y = frameMeta[j][PLANE_POSITION_SEQUENCE_TAG]
                    .Value[0][ROW_POSITION_TAG]
                    .Value;

      const w = Number(dicomInstances[i][TOTAL_PIXEL_MATRIX_COLUMNS_TAG].Value);
      const z = sortedLevelWidths.indexOf(w);

      const key = x + '/' + y + '/' + z;
      pyramidMeta[key] = {
        'SOPInstanceUID': sopInstanceUID,
        'FrameNumber': frameNumber,
      };
    }
  }
  return pyramidMeta;
}

/**
 * Initiate google OAuth2 client.
 */
function handleClientLoad() {
  // Load the API's client and auth2 modules.
  // Call the initClient function after the modules load.
  gapi.load('client:auth2', initClient);
}

/**
 * Initiate google OAuth2 client with provided API key & client ID.
 */
function initClient() {
  // Initialize the gapi.client object, which app uses to make API requests.
  // Get API key and client ID from API Console.
  // 'scope' field specifies space-delimited list of access scopes.
  gapi.auth2.init({'clientId': CLIENT_ID, 'scope': SCOPE})
      .then(
          function() {
            googleAuth = gapi.auth2.getAuthInstance();

            if (googleAuth == null) {
              alert(
                  `OAuth failed, please make sure correct apiKey and clientId
                  filled in.`);
              return;
            }

            // Listen for sign-in state changes.
            googleAuth.isSignedIn.listen(updateForCurrentAuthorization);

            // Handle initial sign-in state.
            updateForCurrentAuthorization();

            // Call handleAuthClick function when user clicks on
            // "Sign In/Authorize" button.
            $('#sign-in-or-out-button').click(function() {
              handleAuthClick();
            });
            $('#revoke-access-button').click(function() {
              googleAuth.disconnect();
              eraseDicomDisplay();
            });
          },
          function() {
            alert(
                `OAuth failed, please make sure correct apiKey and clientId
                filled in.`);
          });
}

/**
 * Handle event when user click auth button.
 */
function handleAuthClick() {
  if (googleAuth.isSignedIn.get()) {
    // User is authorized and has clicked 'Sign out' button.
    googleAuth.signOut();
    eraseDicomDisplay();
  } else {
    // User is not signed in. Start Google auth flow.
    googleAuth.signIn();
  }
}

/**
 * Erase dicom display.
 */
function eraseDicomDisplay() {
  $('#locations-select').empty();
  $('#datasets-select').empty();
  $('#stores-select').empty();
  $('#studies-select').empty();
  viewer.close();
}

/**
 * Change view when auth status changes.
 */
function updateForCurrentAuthorization() {
  const user = googleAuth.currentUser.get();
  const isAuthorized = user.hasGrantedScopes(SCOPE);
  if (isAuthorized) {
    $('#sign-in-or-out-button').html('Sign out');
    $('#revoke-access-button').css('display', 'inline-block');
    $('#auth-status')
        .html(
            'You are currently signed in and have granted ' +
            'access to this app.');
    // TODO: handle expired token
  } else {
    $('#sign-in-or-out-button').html('Sign In/Authorize');
    $('#revoke-access-button').css('display', 'none');
    $('#auth-status')
        .html(
            'You have not authorized this app or you are ' +
            'signed out.');
  }
}
