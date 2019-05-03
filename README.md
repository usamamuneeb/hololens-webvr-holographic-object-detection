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

![Microsoft HoloLens 1](https://raw.githubusercontent.com/usamamuneeb/hololens-webvr-holographic-object-detection/master/g3docs/hololens1.jpg "Microsoft HoloLens 1")

## Requirements

You need:

1. A computer capable of running Python and Tensorflow (nVidia GPU Required) *
2. A WiFi router to connect both the computer and the HoloLens device onto the same network

* For real-time performance, recommended minimum compute capability of GPU is 3.5

## To run the server

Install Python 3.6.X and the following packages via `pip`:

```bash
pip install tensorflow-gpu # (tensorflow (the CPU version) may be too slow)
```

```bash
pip install flask flask_socketio Image
```

You will need to clone the `tensorflow/models` repository. Make sure to clone it and do not download a release version as it will not contain the `research` folder.

```bash
git clone https://github.com/tensorflow/models.git
```

You will then need to run the `protoc` compiler while in the `/path/to/models/research/` directory:

```bash
protoc object_detection/protos/*.proto --python_out=.
```

Note: `protoc` can be downloaded for your platform [here](https://github.com/protocolbuffers/protobuf/releases/latest).

You need to add the following directories to your `PYTHONPATH`: `path\to\models\research` and `path\to\models\research\object_detection`.

To fire up the server, issue the following command while inside the root of the repository:

```bash
FLASK_APP=server.py flask run --host=0.0.0.0
```

## To run the client

The web app can be accessed at port 5000. Check by pointing your browser to: `localhost:5000`.

To access it on your HoloLens or other Mixed Reality Headset that is supported by WebVR, make sure to connect both the headset and your computer running the server to the same WiFi.

Find the IP address of your machine by running `ipconfig` (on Windows) or `ifconfig` (on UNIX). Then point your browser on the headset to `IP_ADDRESS:5000`. You should see a rotating image that should show that your app is running successfully.

### VR Mode

*You may need to enable VR mode for your browser*. On Microsoft Edge (default on HoloLens), you can go to `about:flags` and find the option to enable VR mode there.

You can then enter VR mode and enjoy realtime holographic object detection.

## Tags

`deeplearning` `objectdetection` `holographic` `headset` `microsoft` `hololens` `webvr` `python` `tensorflow`
