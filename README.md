# hololens-webvr-holographic-object-detection
Detection of real-life objects and holographic labelling using Microsoft Hololens.

## Authors

* Usama Muneeb <sup>*</sup>
* Lakshay Mutreja <sup>*</sup>
* Manish Grover <sup>*</sup>

<sup>*</sup> University of Illinois at Chicago

## Description

This is a web app using WebVR on the frontend and Python/Tensorflow at backend for processing real life objects and labeling them using an RCNN (Regions + CNN) network.

Labels are projected using holograms onto the Hololens display on top of real life objects.

## Requirements

You need:

1. A computer capable of running Python and Tensorflow (nVidia GPU Required) *
2. A WiFi switch to connect both the computer and the HoloLens device onto the same network

* Recommended minimum compute capability of GPU is 6.1

## To run the server

Install Python 3.6.X and the following packages via `pip`:

* tensorflow or tensorflow-gpu

To fire up the server, issue the following command while inside the root of the repository:

```bash
FLASK_APP=server.py flask run --host=0.0.0.0
```

## Tags

`deeplearning` `objectdetection` `holographic` `headset` `microsoft` `hololens` `webvr` `python` `tensorflow`
