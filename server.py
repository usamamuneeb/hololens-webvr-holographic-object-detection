"""""""""""""""""""""""""""""""""
Start Flask Imports
"""""""""""""""""""""""""""""""""
from flask import Flask, render_template
from flask_socketio import SocketIO, emit,send
from flask import request
import sys
from base64 import b64decode, b64encode
import io
import time

"""""""""""""""""""""""""""""""""
Start RCNN Imports
"""""""""""""""""""""""""""""""""
import numpy as np
import os
import six.moves.urllib as urllib
import sys
import tarfile
import tensorflow as tf
import zipfile
import argparse
from distutils.version import StrictVersion
from collections import defaultdict
from io import StringIO
from matplotlib import pyplot as plt
from PIL import Image
from glob import glob

from object_detection.utils import ops as utils_ops

if StrictVersion(tf.__version__) < StrictVersion('1.9.0'):
  raise ImportError('Please upgrade your TensorFlow installation to v1.9.* or later!')

from utils import label_map_util
# from utils import visualization_utils as vis_util
from genLabeledImage import visualize_boxes_and_labels_on_image_array

"""""""""""""""""""""""""""""""""
Prepare for Tensorflow
"""""""""""""""""""""""""""""""""

PATH_TO_LABELS = os.path.join('mscoco_label_map.pbtxt')

MODEL_NAME = 'faster_rcnn_resnet50_coco_2018_01_28'
MODEL_FILE = MODEL_NAME + '.tar.gz'


if os.path.isfile(os.path.join('.', MODEL_FILE)):
    print(MODEL_FILE + ' exists, no need to download.')
else:
    print('Downloading ' + MODEL_FILE + ' from server.')
    DOWNLOAD_BASE = 'http://download.tensorflow.org/models/object_detection/'
    opener = urllib.request.URLopener()
    opener.retrieve(DOWNLOAD_BASE + MODEL_FILE, MODEL_FILE)


print('Checking ' + MODEL_FILE + '.')
tar_file = tarfile.open(MODEL_FILE)
for file in tar_file.getmembers():
  file_name = os.path.basename(file.name)
  if 'frozen_inference_graph.pb' in file_name:
    print('Extracting ' + MODEL_FILE + '.')
    tar_file.extract(file, os.getcwd())




"""
Load a (frozen) Tensorflow model into memory.
"""

PATH_TO_FROZEN_GRAPH = MODEL_NAME + '/frozen_inference_graph.pb'

detection_graph = tf.Graph()
with detection_graph.as_default():
  od_graph_def = tf.GraphDef()
  with tf.gfile.GFile(PATH_TO_FROZEN_GRAPH, 'rb') as fid:
    serialized_graph = fid.read()
    od_graph_def.ParseFromString(serialized_graph)
    tf.import_graph_def(od_graph_def, name='')



"""
Loading label map
"""
category_index = label_map_util.create_category_index_from_labelmap(PATH_TO_LABELS, use_display_name=True)


"""
Helper code
"""


def load_image_into_numpy_array(image):
  (im_width, im_height) = image.size
  return np.array(image.getdata()).reshape(
      (im_height, im_width, 3)).astype(np.uint8)







"""
Add operations to the Detection Graph
"""

with detection_graph.as_default():
    # Get handles to input and output tensors
    ops = tf.get_default_graph().get_operations()
    all_tensor_names = {output.name for op in ops for output in op.outputs}
    tensor_dict = {}
    for key in [
        'num_detections', 'detection_boxes',
        'detection_scores', 'detection_classes',
        'detection_masks'
    ]:
        tensor_name = key + ':0'
        if tensor_name in all_tensor_names:
            tensor_dict[key] = tf.get_default_graph().get_tensor_by_name(
                tensor_name
            )
    if 'detection_masks' in tensor_dict:
        # The following processing is only for single image
        detection_boxes = tf.squeeze(tensor_dict['detection_boxes'], [0])
        detection_masks = tf.squeeze(tensor_dict['detection_masks'], [0])

        # Reframe is required to translate mask from box coordinates to image coordinates and fit the image size.
        real_num_detection = tf.cast(tensor_dict['num_detections'][0], tf.int32)
        detection_boxes = tf.slice(detection_boxes, [0, 0], [real_num_detection, -1])
        detection_masks = tf.slice(detection_masks, [0, 0, 0], [real_num_detection, -1, -1])

        detection_masks_reframed = utils_ops.reframe_box_masks_to_image_masks(detection_masks, detection_boxes, image.shape[0], image.shape[1])
        detection_masks_reframed = tf.cast(tf.greater(detection_masks_reframed, 0.5), tf.uint8)

        # Follow the convention by adding back the batch dimension
        tensor_dict['detection_masks'] = tf.expand_dims(detection_masks_reframed, 0)
    image_tensor = tf.get_default_graph().get_tensor_by_name('image_tensor:0')


sess = tf.Session(graph=detection_graph)


def run_inference_for_single_image(image, graph):
    output_dict = sess.run(tensor_dict, feed_dict={image_tensor: image})
    output_dict['num_detections'] = output_dict['num_detections'].astype(int)
    output_dict['detection_classes'] = output_dict['detection_classes'].astype(np.uint8)
    return output_dict


def getLabeledImagesFromImages(myImages, output_dict):
    if not os.path.exists(os.path.join('.', 'outputs')):
        os.mkdir(os.path.join('.', 'outputs'))

    labeled_image = None

    for image_idx in range(0, len(myImages)):
        labeled_image = visualize_boxes_and_labels_on_image_array(
            myImages[image_idx].shape[0],
            myImages[image_idx].shape[1],
            output_dict['detection_boxes'][image_idx],
            output_dict['detection_classes'][image_idx],
            output_dict['detection_scores'][image_idx],
            category_index,
            # instance_masks=detection_mask_word[image_idx],
            use_normalized_coordinates=True,
            line_thickness=1
            #   skip_scores=True,
            #   skip_labels=True
        )
        labeled_image.save(
            os.path.join('.', 'outputs', str(time.time()) + '.png')
        )

        break # no more images in array anyways

    # RETURN DATA URI OF THIS LABELED IMAGE
    buffered = io.BytesIO()
    labeled_image.resize((2048,1024)).save(buffered, format="PNG")
    encoded_image = b64encode(buffered.getvalue()).decode()
    return 'data:image/png;base64,{}'.format(encoded_image)


"""""""""""""""""""""""""""""""""
Start the server
"""""""""""""""""""""""""""""""""
# SERVE STATIC PAGE
app = Flask(__name__,
            static_url_path='',
            static_folder='static',
            template_folder='static')
socketio = SocketIO(app)

clients = []

# SERVE STATIC PAGE
@app.route('/')
def index():
    return render_template('index.html')


# HANDLE NEW CLIENT CONNECTION
@socketio.on('connect')
def connect():
    requestParams = request.event['args'][0]
    print("New Client Connected: " + str(requestParams['REMOTE_ADDR']) + ":" + str(requestParams['REMOTE_PORT']))
    sys.stdout.flush()
    emit("to_client", "Welcome!")
    return "Welcome!"


# HANDLE DATA SENT TO SERVER
@socketio.on('to_server')
def handle_message(json):
    print('=> Received Data: ' + str(json))
    print('=> Echo\'ed Back: ' + str(json))
    sys.stdout.flush()
    emit("to_client", json)
    return json



# HANDLE PICTURE DATA SENT TO SERVER
@socketio.on('pic_to_server')
def handle_message(json):
    # print('=> Received Data: ' + str(json))
    print('=> Received Data: <IMAGE_BASE64_DATA_URI>')



    data_uri = str(json)
    header, encoded = data_uri.split(",", 1)
    data = b64decode(encoded)

    # with open("image.jpg", "wb") as f:
    #     f.write(data)
    image_bytes = io.BytesIO(data)
    image_PIL = Image.open(image_bytes).convert('RGB')
    image_PIL.save('myImageArray.png')
    image_numpy = load_image_into_numpy_array(image_PIL)

    output_dict = run_inference_for_single_image([image_numpy], detection_graph)
    labeled_image = getLabeledImagesFromImages([image_numpy], output_dict)


    print('=> Echo\'ed Back: <LABEL_BASE64_DATA_URI>')
    sys.stdout.flush()
    emit("pic_to_client", labeled_image)
    return labeled_image


# CREATE AN INSTANCE AND FIRE IT UP
if __name__ == '__main__':
    socketio.run(app)
#     app.run('0.0.0.0', 2222, debug=True)
