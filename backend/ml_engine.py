import cv2
import math
import time
import mediapipe as mp
import numpy as np

class SmartSessionEngine:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh   #type: ignore
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=2, refine_landmarks=True, min_detection_confidence=0.5, min_tracking_confidence=0.5
        )
        self.looking_away_start_time = None

    def _dist(self, p1, p2):
        return math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2)

    def _get_eye_ratio(self, landmarks, indices):
        p1 = landmarks[indices[0]]
        p2 = landmarks[indices[1]]
        p3 = landmarks[indices[2]]
        p4 = landmarks[indices[3]]
        
        width = self._dist(p1, p2)
        height = self._dist(p3, p4)
        return height / width

    def analyze_frame(self, frame):
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        output = {"status": "Focused", "color": "green", "gaze": "Center", "proctor_alert": False, "message": "Focused"}

        if not results.multi_face_landmarks:
            output.update({"status": "No Face Detected!", "color": "red", "message": "Proctor Alert", "proctor_alert": True})
            return output

        if len(results.multi_face_landmarks) > 1:
            output.update({"status": "Proctor Alert", "color": "red", "message": "Multiple People!", "proctor_alert": True})
            return output

        lm = results.multi_face_landmarks[0].landmark
        
        face_w = self._dist(lm[454], lm[234])
        face_h = self._dist(lm[152], lm[10])
        
        rel_nose_x = (lm[1].x - lm[234].x) / face_w
        rel_nose_y = (lm[1].y - lm[10].y) / face_h

        if rel_nose_x < 0.25: output["gaze"] = "Looking Right"
        elif rel_nose_x > 0.75: output["gaze"] = "Looking Left"
        elif rel_nose_y < 0.35: output["gaze"] = "Looking Up"
        elif rel_nose_y > 0.65: output["gaze"] = "Looking Down"

        if output["gaze"] != "Center":
            if self.looking_away_start_time is None: self.looking_away_start_time = time.time()
            elif time.time() - self.looking_away_start_time > 4.0:
                output.update({"status": "Looking Away", "color": "red", "message": "Proctor Alert", "proctor_alert": True})
        else: self.looking_away_start_time = None

        if output["proctor_alert"]: return output

        mouth_w = self._dist(lm[61], lm[291])
        if (mouth_w / face_w) > 0.40:
            output.update({"status": "Happy", "color": "blue", "message": "Happy/Excited"})
            return output

        brow_dist = self._dist(lm[107], lm[336])
        left_eye_ratio = self._get_eye_ratio(lm, [33, 133, 159, 145])
        right_eye_ratio = self._get_eye_ratio(lm, [362, 263, 386, 374])
        avg_eye_ratio = (left_eye_ratio + right_eye_ratio) / 2

        dx = lm[33].x - lm[263].x
        dy = lm[33].y - lm[263].y
        tilt = abs(math.degrees(math.atan2(dy, dx))) - 180
        is_tilted = abs(tilt) > 7
        is_squinting = avg_eye_ratio < 0.35
        is_frowning = brow_dist < 0.045

        if (is_frowning and is_tilted and is_squinting) or (is_frowning and is_squinting):
            output.update({"status": "Confused", "color": "yellow", "message": "Student Confused"})
            return output

        return output