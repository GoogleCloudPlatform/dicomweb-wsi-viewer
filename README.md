# DICOMweb WSI Viewer

This repository contains a proof-of-concept whole slide imaging viewer powered
by a DICOMweb server. This particular tool uses the
[Google Cloud Healthcare API](https://cloud.google.com/healthcare/) DICOMweb
implementation.

## Prerequisites

You need to have access to the
[Google Cloud Healthcare API](https://cloud.google.com/healthcare/) and have
created a DICOM store with some DICOM WSIs in it.

Once you have access to the Cloud Healthcare API you can follow the
[quickstart](https://cloud.google.com/healthcare/docs/quickstart) to create a
DICOM store and upload some sample DICOM images.

To create DICOM WSIs you first need to get some pathology images
(https://openslide.org/) has some test data you can use) and the convert them to
DICOM. To convert to DICOM you can use a tool like the DICOMizer CLI from the
[Orthanc WSI Plugin](orthanc-server.com/static.php?page=wsi).

## Getting Started

Once you've created a DICOM store with some DICOM WSIs in it, the following
steps will bring up the viewer:

1) Clone this repository
2) Insert client secret id:
    - Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
    - Create new OAuth Client ID (type 'Web application')
    - When setting up the OAuth consent screen make sure to add https://www.googleapis.com/auth/cloud-healthcare to the list of scopes.
    - Add http://localhost:8000 to the Authorized JavaScript Origins & Authorized redirect URIs
    - Copy the Client ID into viewer.js
3) Run `python -m SimpleHTTPServer 8000` from the root folder of the directory
4) Navigate to https://localhost:8000
