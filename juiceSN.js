/*
 The MIT License (MIT)
 Copyright (c) 2016 Jesse Miller <jmiller@jmiller.com>
 Copyright (c) 2016 Alexey Korepanov <kaikaikai@yandex.ru>
 Copyright (c) 2016 Ermiya Eskandary & Théophile Cailliau and other contributors
 https://jmiller.mit-license.org/
 */
// ==UserScript==
// @name         Slither Bot by Juice SN
// @namespace    https://github.com/sn1432/slither/blob/master/juiceSN.js
// @version      1.4
// @description  Slither.io Mods by Juice SN with Bot mode
// @author       Credits to Jesse Miller
// @match        http://slither.io/
// @supportURL   https://github.com/sn1432/slither/blob/master/juiceSN.js
// @grant        none
// ==/UserScript==

// Custom logging function - disabled by default
window.log = function () {
if (window.logDebugging) {
console.log.apply(console, arguments);
        }
};
        var canvas = window.canvas = (function (window) {
        return {
// Spoofs moving the mouse to the provided coordinates.
        setMouseCoordinates: function (point) {
        window.xm = point.x;
                window.ym = point.y;
        },
                // Convert map coordinates to mouse coordinates.
                mapToMouse: function (point) {
                var mouseX = (point.x - window.snake.xx) * window.gsc;
                        var mouseY = (point.y - window.snake.yy) * window.gsc;
                        return { x: mouseX, y: mouseY };
                },
                // Map cordinates to Canvas cordinate shortcut
                mapToCanvas: function (point) {
                var c = {
                x: window.mww2 + (point.x - window.view_xx) * window.gsc,
                        y: window.mhh2 + (point.y - window.view_yy) * window.gsc
                };
                        return c;
                },
                // Map to Canvas coordinate conversion for drawing circles.
                // Radius also needs to scale by .gsc
                circleMapToCanvas: function (circle) {
                var newCircle = canvas.mapToCanvas({
                x: circle.x,
                        y: circle.y
                });
                        return canvas.circle(
                                newCircle.x,
                                newCircle.y,
                                circle.radius * window.gsc
                                );
                },
                // Constructor for point type
                point: function (x, y) {
                var p = {
                x: Math.round(x),
                        y: Math.round(y)
                };
                        return p;
                },
                // Constructor for rect type
                rect: function (x, y, w, h) {
                var r = {
                x: Math.round(x),
                        y: Math.round(y),
                        width: Math.round(w),
                        height: Math.round(h)
                };
                        return r;
                },
                // Constructor for circle type
                circle: function (x, y, r) {
                var c = {
                x: Math.round(x),
                        y: Math.round(y),
                        radius: Math.round(r)
                };
                        return c;
                },
                // Fast atan2
                fastAtan2: function (y, x) {
                const QPI = Math.PI / 4;
                        const TQPI = 3 * Math.PI / 4;
                        var r = 0.0;
                        var angle = 0.0;
                        var abs_y = Math.abs(y) + 1e-10;
                        if (x < 0) {
                r = (x + abs_y) / (abs_y - x);
                        angle = TQPI;
                } else {
                r = (x - abs_y) / (x + abs_y);
                        angle = QPI;
                }
                angle += (0.1963 * r * r - 0.9817) * r;
                        if (y < 0) {
                return - angle;
                }

                return angle;
                },
                // Draw a rectangle on the canvas.
                drawRect: function (rect, color, fill, alpha) {
                if (alpha === undefined) alpha = 1;
                        var context = window.mc.getContext('2d');
                        var lc = canvas.mapToCanvas({ x: rect.x, y: rect.y });
                        context.save();
                        context.globalAlpha = alpha;
                        context.strokeStyle = color;
                        context.rect(lc.x, lc.y, rect.width * window.gsc, rect.height * window.gsc);
                        context.stroke();
                        if (fill) {
                context.fillStyle = color;
                        context.fill();
                }
                context.restore();
                },
                // Draw a circle on the canvas.
                drawCircle: function (circle, color, fill, alpha) {
                if (alpha === undefined) alpha = 1;
                        if (circle.radius === undefined) circle.radius = 5;
                        var context = window.mc.getContext('2d');
                        var drawCircle = canvas.circleMapToCanvas(circle);
                        context.save();
                        context.globalAlpha = alpha;
                        context.beginPath();
                        context.strokeStyle = color;
                        context.arc(drawCircle.x, drawCircle.y, drawCircle.radius, 0, Math.PI * 2);
                        context.stroke();
                        if (fill) {
                context.fillStyle = color;
                        context.fill();
                }
                context.restore();
                },
                // Draw an angle.
                // @param {number} start -- where to start the angle
                // @param {number} angle -- width of the angle
                // @param {bool} danger -- green if false, red if true
                drawAngle: function (start, angle, color, fill, alpha) {
                if (alpha === undefined) alpha = 0.6;
                        var context = window.mc.getContext('2d');
                        context.save();
                        context.globalAlpha = alpha;
                        context.beginPath();
                        context.moveTo(window.mc.width / 2, window.mc.height / 2);
                        context.arc(window.mc.width / 2, window.mc.height / 2, window.gsc * 100, start, angle);
                        context.lineTo(window.mc.width / 2, window.mc.height / 2);
                        context.closePath();
                        context.stroke();
                        if (fill) {
                context.fillStyle = color;
                        context.fill();
                }
                context.restore();
                },
                // Draw a line on the canvas.
                drawLine: function (p1, p2, color, width) {
                if (width === undefined) width = 5;
                        var context = window.mc.getContext('2d');
                        var dp1 = canvas.mapToCanvas(p1);
                        var dp2 = canvas.mapToCanvas(p2);
                        context.save();
                        context.beginPath();
                        context.lineWidth = width * window.gsc;
                        context.strokeStyle = color;
                        context.moveTo(dp1.x, dp1.y);
                        context.lineTo(dp2.x, dp2.y);
                        context.stroke();
                        context.restore();
                },
                // Given the start and end of a line, is point left.
                isLeft: function (start, end, point) {
                return ((end.x - start.x) * (point.y - start.y) -
                        (end.y - start.y) * (point.x - start.x)) > 0;
                },
                // Get distance squared
                getDistance2: function (x1, y1, x2, y2) {
                var distance2 = Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
                        return distance2;
                },
                getDistance2FromSnake: function (point) {
                point.distance = canvas.getDistance2(window.snake.xx, window.snake.yy,
                        point.xx, point.yy);
                        return point;
                },
                // return unit vector in the direction of the argument
                unitVector: function (v) {
                var l = Math.sqrt(v.x * v.x + v.y * v.y);
                        if (l > 0) {
                return {
                x: v.x / l,
                        y: v.y / l
                };
                } else {
                return {
                x: 0,
                        y: 0
                };
                }
                },
                // Check if point in Rect
                pointInRect: function (point, rect) {
                if (rect.x <= point.x && rect.y <= point.y &&
                        rect.x + rect.width >= point.x && rect.y + rect.height >= point.y) {
                return true;
                }
                return false;
                },
                // check if point is in polygon
                pointInPoly: function (point, poly) {
                if (point.x < poly.minx || point.x > poly.maxx ||
                        point.y < poly.miny || point.y > poly.maxy) {
                return false;
                }
                let c = false;
                        const l = poly.pts.length;
                        for (let i = 0, j = l - 1; i < l; j = i++) {
                if (((poly.pts[i].y > point.y) != (poly.pts[j].y > point.y)) &&
                        (point.x < (poly.pts[j].x - poly.pts[i].x) * (point.y - poly.pts[i].y) /
                                (poly.pts[j].y - poly.pts[i].y) + poly.pts[i].x)) {
                c = !c;
                }
                }
                return c;
                },
                addPolyBox: function (poly) {
                var minx = poly.pts[0].x;
                        var maxx = poly.pts[0].x;
                        var miny = poly.pts[0].y;
                        var maxy = poly.pts[0].y;
                        for (let p = 1, l = poly.pts.length; p < l; p++) {
                if (poly.pts[p].x < minx) {
                minx = poly.pts[p].x;
                }
                if (poly.pts[p].x > maxx) {
                maxx = poly.pts[p].x;
                }
                if (poly.pts[p].y < miny) {
                miny = poly.pts[p].y;
                }
                if (poly.pts[p].y > maxy) {
                maxy = poly.pts[p].y;
                }
                }
                return {
                pts: poly.pts,
                        minx: minx,
                        maxx: maxx,
                        miny: miny,
                        maxy: maxy
                };
                },
                cross: function (o, a, b) {
                return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
                },
                convexHullSort: function (a, b) {
                return a.x == b.x ? a.y - b.y : a.x - b.x;
                },
                convexHull: function (points) {
                points.sort(canvas.convexHullSort);
                        var lower = [];
                        for (let i = 0, l = points.length; i < l; i++) {
                while (lower.length >= 2 && canvas.cross(
                        lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
                lower.pop();
                }
                lower.push(points[i]);
                }

                var upper = [];
                        for (let i = points.length - 1; i >= 0; i--) {
                while (upper.length >= 2 && canvas.cross(
                        upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
                upper.pop();
                }
                upper.push(points[i]);
                }

                upper.pop();
                        lower.pop();
                        return lower.concat(upper);
                },
                // Check if circles intersect
                circleIntersect: function (circle1, circle2) {
                var bothRadii = circle1.radius + circle2.radius;
                        var point = {};
                        // Pretends the circles are squares for a quick collision check.
                        // If it collides, do the more expensive circle check.
                        if (circle1.x + bothRadii > circle2.x &&
                                circle1.y + bothRadii > circle2.y &&
                                circle1.x < circle2.x + bothRadii &&
                                circle1.y < circle2.y + bothRadii) {

                var distance2 = canvas.getDistance2(circle1.x, circle1.y, circle2.x, circle2.y);
                        if (distance2 < bothRadii * bothRadii) {
                point = {
                x: ((circle1.x * circle2.radius) + (circle2.x * circle1.radius)) /
                        bothRadii,
                        y: ((circle1.y * circle2.radius) + (circle2.y * circle1.radius)) /
                        bothRadii,
                        ang: 0.0
                };
                        point.ang = canvas.fastAtan2(
                                point.y - window.snake.yy, point.x - window.snake.xx);
                        if (window.visualDebugging) {
                var collisionPointCircle = canvas.circle(
                        point.x,
                        point.y,
                        5
                        );
                        canvas.drawCircle(circle2, '#ff9900', false);
                        canvas.drawCircle(collisionPointCircle, '#66ff66', true);
                }
                return point;
                }
                }
                return false;
                }
        };
        })(window);
        var bot = window.bot = (function (window) {
        return {
        isBotRunning: false,
                isBotEnabled: false,
                stage: 'grow',
                collisionPoints: [],
                collisionAngles: [],
                foodAngles: [],
                scores: [],
                foodTimeout: undefined,
                sectorBoxSide: 0,
                defaultAccel: 0,
                sectorBox: {},
                currentFood: {},
                opt: {
                // target fps
                targetFps: 20,
                        // size of arc for collisionAngles
                        arcSize: Math.PI / 8,
                        // radius multiple for circle intersects
                        radiusMult: 10,
                        // food cluster size to trigger acceleration
                        foodAccelSz: 200,
                        // maximum angle of food to trigger acceleration
                        foodAccelDa: Math.PI / 2,
                        // how many frames per action
                        actionFrames: 2,
                        // how many frames to delay action after collision
                        collisionDelay: 10,
                        // base speed
                        speedBase: 5.78,
                        // front angle size
                        frontAngle: Math.PI / 2,
                        // percent of angles covered by same snake to be considered an encircle attempt
                        enCircleThreshold: 0.5625,
                        // percent of angles covered by all snakes to move to safety
                        enCircleAllThreshold: 0.5625,
                        // distance multiplier for enCircleAllThreshold
                        enCircleDistanceMult: 20,
                        // snake score to start circling on self
                        followCircleLength: 100000,
                        // direction for followCircle: +1 for counter clockwise and -1 for clockwise
                        followCircleDirection: + 1
                },
                MID_X: 0,
                MID_Y: 0,
                MAP_R: 0,
                MAXARC: 0,
                getSnakeWidth: function (sc) {
                if (sc === undefined) sc = window.snake.sc;
                        return Math.round(sc * 29.0);
                },
                quickRespawn: function () {
                window.dead_mtm = 0;
                        window.login_fr = 0;
                        bot.isBotRunning = false;
                        window.forcing = true;
                        bot.connect();
                        window.forcing = false;
                },
                connect: function () {
                if (window.force_ip && window.force_port) {
                window.forceServer(window.force_ip, window.force_port);
                }

                window.connect();
                },
                // angleBetween - get the smallest angle between two angles (0-pi)
                angleBetween: function (a1, a2) {
                var r1 = 0.0;
                        var r2 = 0.0;
                        r1 = (a1 - a2) % Math.PI;
                        r2 = (a2 - a1) % Math.PI;
                        return r1 < r2 ? - r1 : r2;
                },
                // Change heading to ang
                changeHeadingAbs: function (angle) {
                var cos = Math.cos(angle);
                        var sin = Math.sin(angle);
                        window.goalCoordinates = {
                        x: Math.round(
                                window.snake.xx + (bot.headCircle.radius) * cos),
                                y: Math.round(
                                        window.snake.yy + (bot.headCircle.radius) * sin)
                        };
                        /*if (window.visualDebugging) {
                         canvas.drawLine({
                         x: window.snake.xx,
                         y: window.snake.yy},
                         window.goalCoordinates, 'yellow', '8');
                         }*/

                        canvas.setMouseCoordinates(canvas.mapToMouse(window.goalCoordinates));
                },
                // Change heading by ang
                // +0-pi turn left
                // -0-pi turn right

                changeHeadingRel: function (angle) {
                var heading = {
                x: window.snake.xx + 500 * bot.cos,
                        y: window.snake.yy + 500 * bot.sin
                };
                        var cos = Math.cos( - angle);
                        var sin = Math.sin( - angle);
                        window.goalCoordinates = {
                        x: Math.round(
                                cos * (heading.x - window.snake.xx) -
                                sin * (heading.y - window.snake.yy) + window.snake.xx),
                                y: Math.round(
                                        sin * (heading.x - window.snake.xx) +
                                        cos * (heading.y - window.snake.yy) + window.snake.yy)
                        };
                        canvas.setMouseCoordinates(canvas.mapToMouse(window.goalCoordinates));
                },
                // Change heading to the best angle for avoidance.
                headingBestAngle: function () {
                var best;
                        var distance;
                        var openAngles = [];
                        var openStart;
                        var sIndex = bot.getAngleIndex(window.snake.ehang) + bot.MAXARC / 2;
                        if (sIndex > bot.MAXARC) sIndex -= bot.MAXARC;
                        for (var i = 0; i < bot.MAXARC; i++) {
                if (bot.collisionAngles[i] === undefined) {
                distance = 0;
                        if (openStart === undefined) openStart = i;
                } else {
                distance = bot.collisionAngles[i].distance;
                        if (openStart) {
                openAngles.push({
                openStart: openStart,
                        openEnd: i - 1,
                        sz: (i - 1) - openStart
                });
                        openStart = undefined;
                }
                }

                if (best === undefined ||
                        (best.distance < distance && best.distance !== 0)) {
                best = {
                distance: distance,
                        aIndex: i
                };
                }
                }

                if (openStart && openAngles[0]) {
                openAngles[0].openStart = openStart;
                        openAngles[0].sz = openAngles[0].openEnd - openStart;
                        if (openAngles[0].sz < 0) openAngles[0].sz += bot.MAXARC;
                } else if (openStart) {
                openAngles.push({openStart: openStart, openEnd: openStart, sz: 0});
                }

                if (openAngles.length > 0) {
                openAngles.sort(bot.sortSz);
                        bot.changeHeadingAbs(
                                (openAngles[0].openEnd - openAngles[0].sz / 2) * bot.opt.arcSize);
                } else {
                bot.changeHeadingAbs(best.aIndex * bot.opt.arcSize);
                }
                },
                // Avoid collision point by ang
                // ang radians <= Math.PI (180deg)
                avoidCollisionPoint: function (point, ang) {
                if (ang === undefined || ang > Math.PI) {
                ang = Math.PI;
                }

                var end = {
                x: window.snake.xx + 2000 * bot.cos,
                        y: window.snake.yy + 2000 * bot.sin
                };
                        if (window.visualDebugging) {
                canvas.drawLine(
                { x: window.snake.xx, y: window.snake.yy },
                        end,
                        'orange', 5);
                        canvas.drawLine(
                        { x: window.snake.xx, y: window.snake.yy },
                        { x: point.x, y: point.y },
                                'red', 5);
                }

                if (canvas.isLeft(
                { x: window.snake.xx, y: window.snake.yy }, end,
                { x: point.x, y: point.y })) {
                bot.changeHeadingAbs(point.ang - ang);
                } else {
                bot.changeHeadingAbs(point.ang + ang);
                }
                },
                // get collision angle index, expects angle +/i 0 to Math.PI
                getAngleIndex: function (angle) {
                var index;
                        if (angle < 0) {
                angle += 2 * Math.PI;
                }

                index = Math.round(angle * (1 / bot.opt.arcSize));
                        if (index === bot.MAXARC) {
                return 0;
                }
                return index;
                },
                // Add to collisionAngles if distance is closer
                addCollisionAngle: function (sp) {
                var ang = canvas.fastAtan2(
                        Math.round(sp.yy - window.snake.yy),
                        Math.round(sp.xx - window.snake.xx));
                        var aIndex = bot.getAngleIndex(ang);
                        var actualDistance = Math.round(Math.pow(
                                Math.sqrt(sp.distance) - sp.radius, 2));
                        if (bot.collisionAngles[aIndex] === undefined ||
                                bot.collisionAngles[aIndex].distance > sp.distance) {
                bot.collisionAngles[aIndex] = {
                x: Math.round(sp.xx),
                        y: Math.round(sp.yy),
                        ang: ang,
                        snake: sp.snake,
                        distance: actualDistance,
                        radius: sp.radius,
                        aIndex: aIndex
                };
                }
                },
                // Add and score foodAngles
                addFoodAngle: function (f) {
                var ang = canvas.fastAtan2(
                        Math.round(f.yy - window.snake.yy),
                        Math.round(f.xx - window.snake.xx));
                        var aIndex = bot.getAngleIndex(ang);
                        canvas.getDistance2FromSnake(f);
                        if (bot.collisionAngles[aIndex] === undefined ||
                                Math.sqrt(bot.collisionAngles[aIndex].distance) >
                                Math.sqrt(f.distance) + bot.snakeRadius * bot.opt.radiusMult * bot.speedMult / 2) {
                if (bot.foodAngles[aIndex] === undefined) {
                bot.foodAngles[aIndex] = {
                x: Math.round(f.xx),
                        y: Math.round(f.yy),
                        ang: ang,
                        da: Math.abs(bot.angleBetween(ang, window.snake.ehang)),
                        distance: f.distance,
                        sz: f.sz,
                        score: Math.pow(f.sz, 2) / f.distance
                };
                } else {
                bot.foodAngles[aIndex].sz += Math.round(f.sz);
                        bot.foodAngles[aIndex].score += Math.pow(f.sz, 2) / f.distance;
                        if (bot.foodAngles[aIndex].distance > f.distance) {
                bot.foodAngles[aIndex].x = Math.round(f.xx);
                        bot.foodAngles[aIndex].y = Math.round(f.yy);
                        bot.foodAngles[aIndex].distance = f.distance;
                }
                }
                }
                },
                // Get closest collision point per snake.
                getCollisionPoints: function () {
                var scPoint;
                        bot.collisionPoints = [];
                        bot.collisionAngles = [];
                        for (var snake = 0, ls = window.snakes.length; snake < ls; snake++) {
                scPoint = undefined;
                        if (window.snakes[snake].id !== window.snake.id &&
                                window.snakes[snake].alive_amt === 1) {

                var s = window.snakes[snake];
                        var sRadius = bot.getSnakeWidth(s.sc) / 2;
                        var sSpMult = Math.min(1, s.sp / 5.78 - 1);
                        scPoint = {
                        xx: s.xx + Math.cos(s.ehang) * sRadius * sSpMult * bot.opt.radiusMult / 2,
                                yy: s.yy + Math.sin(s.ehang) * sRadius * sSpMult * bot.opt.radiusMult / 2,
                                snake: snake,
                                radius: bot.headCircle.radius,
                                head: true
                        };
                        canvas.getDistance2FromSnake(scPoint);
                        bot.addCollisionAngle(scPoint);
                        bot.collisionPoints.push(scPoint);
                        if (window.visualDebugging) {
                canvas.drawCircle(canvas.circle(
                        scPoint.xx,
                        scPoint.yy,
                        scPoint.radius),
                        'red', false);
                }

                scPoint = undefined;
                        for (var pts = 0, lp = s.pts.length; pts < lp; pts++) {
                if (!s.pts[pts].dying &&
                        canvas.pointInRect(
                        {
                        x: s.pts[pts].xx,
                                y: s.pts[pts].yy
                        }, bot.sectorBox)
                        ) {
                var collisionPoint = {
                xx: s.pts[pts].xx,
                        yy: s.pts[pts].yy,
                        snake: snake,
                        radius: sRadius
                };
                        if (window.visualDebugging && true === false) {
                canvas.drawCircle(canvas.circle(
                        collisionPoint.xx,
                        collisionPoint.yy,
                        collisionPoint.radius),
                        '#00FF00', false);
                }

                canvas.getDistance2FromSnake(collisionPoint);
                        bot.addCollisionAngle(collisionPoint);
                        if (collisionPoint.distance <= Math.pow(
                                (bot.headCircle.radius)
                                + collisionPoint.radius, 2)) {
                bot.collisionPoints.push(collisionPoint);
                        if (window.visualDebugging) {
                canvas.drawCircle(canvas.circle(
                        collisionPoint.xx,
                        collisionPoint.yy,
                        collisionPoint.radius
                        ), 'red', false);
                }
                }
                }
                }
                }
                }

                // WALL
                if (canvas.getDistance2(bot.MID_X, bot.MID_Y, window.snake.xx, window.snake.yy) >
                        Math.pow(bot.MAP_R - 1000, 2)) {
                var midAng = canvas.fastAtan2(
                        window.snake.yy - bot.MID_X, window.snake.xx - bot.MID_Y);
                        scPoint = {
                        xx: bot.MID_X + bot.MAP_R * Math.cos(midAng),
                                yy: bot.MID_Y + bot.MAP_R * Math.sin(midAng),
                                snake: - 1,
                                radius: bot.snakeWidth
                        };
                        canvas.getDistance2FromSnake(scPoint);
                        bot.collisionPoints.push(scPoint);
                        bot.addCollisionAngle(scPoint);
                        if (window.visualDebugging) {
                canvas.drawCircle(canvas.circle(
                        scPoint.xx,
                        scPoint.yy,
                        scPoint.radius
                        ), 'yellow', false);
                }
                }


                bot.collisionPoints.sort(bot.sortDistance);
                        if (window.visualDebugging) {
                for (var i = 0; i < bot.collisionAngles.length; i++) {
                if (bot.collisionAngles[i] !== undefined) {
                canvas.drawLine(
                { x: window.snake.xx, y: window.snake.yy },
                { x: bot.collisionAngles[i].x, y: bot.collisionAngles[i].y },
                        'red', 2);
                }
                }
                }
                },
                // Is collisionPoint (xx) in frontAngle
                inFrontAngle: function (point) {
                var ang = canvas.fastAtan2(
                        Math.round(point.y - window.snake.yy),
                        Math.round(point.x - window.snake.xx));
                        if (Math.abs(bot.angleBetween(ang, window.snake.ehang)) < bot.opt.frontAngle) {
                return true;
                } else {
                return false;
                }

                },
                // Checks to see if you are going to collide with anything in the collision detection radius
                checkCollision: function () {
                var point;
                        bot.getCollisionPoints();
                        if (bot.collisionPoints.length === 0) return false;
                        for (var i = 0; i < bot.collisionPoints.length; i++) {
                var collisionCircle = canvas.circle(
                        bot.collisionPoints[i].xx,
                        bot.collisionPoints[i].yy,
                        bot.collisionPoints[i].radius
                        );
                        // -1 snake is special case for non snake object.
                        if ((point = canvas.circleIntersect(bot.headCircle, collisionCircle)) &&
                                bot.inFrontAngle(point)) {
                if (bot.collisionPoints[i].snake !== - 1 &&
                        bot.collisionPoints[i].head &&
                        window.snakes[bot.collisionPoints[i].snake].sp > 10) {
                window.setAcceleration(1);
                } else {
                window.setAcceleration(bot.defaultAccel);
                }
                bot.avoidCollisionPoint(point);
                        return true;
                }
                }

                window.setAcceleration(bot.defaultAccel);
                        return false;
                },
                checkEncircle: function () {
                var enSnake = [];
                        var high = 0;
                        var highSnake;
                        var enAll = 0;
                        for (var i = 0; i < bot.collisionAngles.length; i++) {
                if (bot.collisionAngles[i] !== undefined) {
                var s = bot.collisionAngles[i].snake;
                        if (enSnake[s]) {
                enSnake[s]++;
                } else {
                enSnake[s] = 1;
                }
                if (enSnake[s] > high) {
                high = enSnake[s];
                        highSnake = s;
                }

                if (bot.collisionAngles[i].distance <
                        Math.pow(bot.snakeRadius * bot.opt.enCircleDistanceMult, 2)) {
                enAll++;
                }
                }
                }

                if (high > bot.MAXARC * bot.opt.enCircleThreshold) {
                bot.headingBestAngle();
                        if (high !== bot.MAXARC && window.snakes[highSnake].sp > 10) {
                window.setAcceleration(1);
                } else {
                window.setAcceleration(bot.defaultAccel);
                }

                if (window.visualDebugging) {
                canvas.drawCircle(canvas.circle(
                        window.snake.xx,
                        window.snake.yy,
                        bot.opt.radiusMult * bot.snakeRadius),
                        'red', true, 0.2);
                }
                return true;
                }

                if (enAll > bot.MAXARC * bot.opt.enCircleAllThreshold) {
                bot.headingBestAngle();
                        window.setAcceleration(bot.defaultAccel);
                        if (window.visualDebugging) {
                canvas.drawCircle(canvas.circle(
                        window.snake.xx,
                        window.snake.yy,
                        bot.snakeRadius * bot.opt.enCircleDistanceMult),
                        'yellow', true, 0.2);
                }
                return true;
                } else {
                if (window.visualDebugging) {
                canvas.drawCircle(canvas.circle(
                        window.snake.xx,
                        window.snake.yy,
                        bot.snakeRadius * bot.opt.enCircleDistanceMult),
                        'yellow');
                }
                }

                window.setAcceleration(bot.defaultAccel);
                        return false;
                },
                populatePts: function () {
                let x = window.snake.xx + window.snake.fx;
                        let y = window.snake.yy + window.snake.fy;
                        let l = 0.0;
                        bot.pts = [{
                        x: x,
                                y: y,
                                len: l
                        }];
                        for (let p = window.snake.pts.length - 1; p >= 0; p--) {
                if (window.snake.pts[p].dying) {
                continue;
                } else {
                let xx = window.snake.pts[p].xx + window.snake.pts[p].fx;
                        let yy = window.snake.pts[p].yy + window.snake.pts[p].fy;
                        let ll = l + Math.sqrt(canvas.getDistance2(x, y, xx, yy));
                        bot.pts.push({
                        x: xx,
                                y: yy,
                                len: ll
                        });
                        x = xx;
                        y = yy;
                        l = ll;
                }
                }
                bot.len = l;
                },
                // set the direction of rotation based on the velocity of
                // the head with respect to the center of mass
                determineCircleDirection: function () {
                // find center mass (cx, cy)
                let cx = 0.0;
                        let cy = 0.0;
                        let pn = bot.pts.length;
                        for (let p = 0; p < pn; p++) {
                cx += bot.pts[p].x;
                        cy += bot.pts[p].y;
                }
                cx /= pn;
                        cy /= pn;
                        // vector from (cx, cy) to the head
                        let head = {
                        x: window.snake.xx + window.snake.fx,
                                y: window.snake.yy + window.snake.fy
                        };
                        let dx = head.x - cx;
                        let dy = head.y - cy;
                        // check the sign of dot product of (bot.cos, bot.sin) and (-dy, dx)
                        if ( - dy * bot.cos + dx * bot.sin > 0) {
                // clockwise
                bot.opt.followCircleDirection = - 1;
                } else {
                // couter clockwise
                bot.opt.followCircleDirection = + 1;
                }
                },
                // returns a point on snake's body on given length from the head
                // assumes that bot.pts is populated
                smoothPoint: function (t) {
                // range check
                if (t >= bot.len) {
                let tail = bot.pts[bot.pts.length - 1];
                        return {
                        x: tail.x,
                                y: tail.y
                        };
                } else if (t <= 0) {
                return {
                x: bot.pts[0].x,
                        y: bot.pts[0].y
                };
                }
                // binary search
                let p = 0;
                        let q = bot.pts.length - 1;
                        while (q - p > 1) {
                let m = Math.round((p + q) / 2);
                        if (t > bot.pts[m].len) {
                p = m;
                } else {
                q = m;
                }
                }
                // now q = p + 1, and the point is in between;
                // compute approximation
                let wp = bot.pts[q].len - t;
                        let wq = t - bot.pts[p].len;
                        let w = wp + wq;
                        return {
                        x: (wp * bot.pts[p].x + wq * bot.pts[q].x) / w,
                                y: (wp * bot.pts[p].y + wq * bot.pts[q].y) / w
                        };
                },
                // finds a point on snake's body closest to the head;
                // returns length from the head
                // excludes points close to the head
                closestBodyPoint: function () {
                let head = {
                x: window.snake.xx + window.snake.fx,
                        y: window.snake.yy + window.snake.fy
                };
                        let ptsLength = bot.pts.length;
                        // skip head area
                        let start_n = 0;
                        let start_d2 = 0.0;
                        for (; ; ) {
                let prev_d2 = start_d2;
                        start_n ++;
                        start_d2 = canvas.getDistance2(head.x, head.y,
                                bot.pts[start_n].x, bot.pts[start_n].y);
                        if (start_d2 < prev_d2 || start_n == ptsLength - 1) {
                break;
                }
                }

                if (start_n >= ptsLength || start_n <= 1) {
                return bot.len;
                }

                // find closets point in bot.pts
                let min_n = start_n;
                        let min_d2 = start_d2;
                        for (let n = min_n + 1; n < ptsLength; n++) {
                let d2 = canvas.getDistance2(head.x, head.y, bot.pts[n].x, bot.pts[n].y);
                        if (d2 < min_d2) {
                min_n = n;
                        min_d2 = d2;
                }
                }

                // find second closest point
                let next_n = min_n;
                        let next_d2 = min_d2;
                        if (min_n == ptsLength - 1) {
                next_n = min_n - 1;
                        next_d2 = canvas.getDistance2(head.x, head.y,
                                bot.pts[next_n].x, bot.pts[next_n].y);
                } else {
                let d2m = canvas.getDistance2(head.x, head.y,
                        bot.pts[min_n - 1].x, bot.pts[min_n - 1].y);
                        let d2p = canvas.getDistance2(head.x, head.y,
                                bot.pts[min_n + 1].x, bot.pts[min_n + 1].y);
                        if (d2m < d2p) {
                next_n = min_n - 1;
                        next_d2 = d2m;
                } else {
                next_n = min_n + 1;
                        next_d2 = d2p;
                }
                }

                // compute approximation
                let t2 = bot.pts[min_n].len - bot.pts[next_n].len;
                        t2 *= t2;
                        if (t2 == 0) {
                return bot.pts[min_n].len;
                } else {
                let min_w = t2 - (min_d2 - next_d2);
                        let next_w = t2 + (min_d2 - next_d2);
                        return (bot.pts[min_n].len * min_w + bot.pts[next_n].len * next_w) / (2 * t2);
                }
                },
                bodyDangerZone: function (
                        offset, targetPoint, targetPointNormal, closePointDist, pastTargetPoint, closePoint) {
                var head = {
                x: window.snake.xx + window.snake.fx,
                        y: window.snake.yy + window.snake.fy
                };
                        const o = bot.opt.followCircleDirection;
                        var pts = [
                        {
                        x: head.x - o * offset * bot.sin,
                                y: head.y + o * offset * bot.cos
                        },
                        {
                        x: head.x + bot.snakeWidth * bot.cos +
                                offset * (bot.cos - o * bot.sin),
                                y: head.y + bot.snakeWidth * bot.sin +
                                offset * (bot.sin + o * bot.cos)
                        },
                        {
                        x: head.x + 1.75 * bot.snakeWidth * bot.cos +
                                o * 0.3 * bot.snakeWidth * bot.sin +
                                offset * (bot.cos - o * bot.sin),
                                y: head.y + 1.75 * bot.snakeWidth * bot.sin -
                                o * 0.3 * bot.snakeWidth * bot.cos +
                                offset * (bot.sin + o * bot.cos)
                        },
                        {
                        x: head.x + 2.5 * bot.snakeWidth * bot.cos +
                                o * 0.7 * bot.snakeWidth * bot.sin +
                                offset * (bot.cos - o * bot.sin),
                                y: head.y + 2.5 * bot.snakeWidth * bot.sin -
                                o * 0.7 * bot.snakeWidth * bot.cos +
                                offset * (bot.sin + o * bot.cos)
                        },
                        {
                        x: head.x + 3 * bot.snakeWidth * bot.cos +
                                o * 1.2 * bot.snakeWidth * bot.sin +
                                offset * bot.cos,
                                y: head.y + 3 * bot.snakeWidth * bot.sin -
                                o * 1.2 * bot.snakeWidth * bot.cos +
                                offset * bot.sin
                        },
                        {
                        x: targetPoint.x +
                                targetPointNormal.x * (offset + 0.5 * Math.max(closePointDist, 0)),
                                y: targetPoint.y +
                                targetPointNormal.y * (offset + 0.5 * Math.max(closePointDist, 0))
                        },
                        {
                        x: pastTargetPoint.x + targetPointNormal.x * offset,
                                y: pastTargetPoint.y + targetPointNormal.y * offset
                        },
                                pastTargetPoint,
                                targetPoint,
                                closePoint
                        ];
                        pts = canvas.convexHull(pts);
                        var poly = {
                        pts: pts
                        };
                        poly = canvas.addPolyBox(poly);
                        return (poly);
                },
                followCircleSelf: function () {

                bot.populatePts();
                        bot.determineCircleDirection();
                        const o = bot.opt.followCircleDirection;
                        // exit if too short
                        if (bot.len < 9 * bot.snakeWidth) {
                return;
                }

                var head = {
                x: window.snake.xx + window.snake.fx,
                        y: window.snake.yy + window.snake.fy
                };
                        let closePointT = bot.closestBodyPoint();
                        let closePoint = bot.smoothPoint(closePointT);
                        // approx tangent and normal vectors and closePoint
                        var closePointNext = bot.smoothPoint(closePointT - bot.snakeWidth);
                        var closePointTangent = canvas.unitVector({
                        x: closePointNext.x - closePoint.x,
                                y: closePointNext.y - closePoint.y});
                        var closePointNormal = {
                        x: - o * closePointTangent.y,
                                y:   o * closePointTangent.x
                        };
                        // angle wrt closePointTangent
                        var currentCourse = Math.asin(Math.max(
                                - 1, Math.min(1, bot.cos * closePointNormal.x + bot.sin * closePointNormal.y)));
                        // compute (oriented) distance from the body at closePointDist
                        var closePointDist = (head.x - closePoint.x) * closePointNormal.x +
                        (head.y - closePoint.y) * closePointNormal.y;
                        // construct polygon for snake inside
                        var insidePolygonStartT = 5 * bot.snakeWidth;
                        var insidePolygonEndT = closePointT + 5 * bot.snakeWidth;
                        var insidePolygonPts = [
                                bot.smoothPoint(insidePolygonEndT),
                                bot.smoothPoint(insidePolygonStartT)
                        ];
                        for (let t = insidePolygonStartT; t < insidePolygonEndT; t += bot.snakeWidth) {
                insidePolygonPts.push(bot.smoothPoint(t));
                }

                var insidePolygon = canvas.addPolyBox({
                pts: insidePolygonPts
                });
                        // get target point; this is an estimate where we land if we hurry
                        var targetPointT = closePointT;
                        var targetPointFar = 0.0;
                        let targetPointStep = bot.snakeWidth / 64;
                        for (let h = closePointDist, a = currentCourse; h >= 0.125 * bot.snakeWidth; ) {
                targetPointT -= targetPointStep;
                        targetPointFar += targetPointStep * Math.cos(a);
                        h += targetPointStep * Math.sin(a);
                        a = Math.max( - Math.PI / 4, a - targetPointStep / bot.snakeWidth);
                }

                var targetPoint = bot.smoothPoint(targetPointT);
                        var pastTargetPointT = targetPointT - 3 * bot.snakeWidth;
                        var pastTargetPoint = bot.smoothPoint(pastTargetPointT);
                        // look for danger from enemies
                        var enemyBodyOffsetDelta = 0.25 * bot.snakeWidth;
                        var enemyHeadDist2 = 64 * 64 * bot.snakeWidth * bot.snakeWidth;
                        for (let snake = 0, snakesNum = window.snakes.length; snake < snakesNum; snake++) {
                if (window.snakes[snake].id !== window.snake.id
                        && window.snakes[snake].alive_amt === 1) {
                let enemyHead = {
                x: window.snakes[snake].xx + window.snakes[snake].fx,
                        y: window.snakes[snake].yy + window.snakes[snake].fy
                };
                        let enemyAhead = {
                        x: enemyHead.x +
                                Math.cos(window.snakes[snake].ang) * bot.snakeWidth,
                                y: enemyHead.y +
                                Math.sin(window.snakes[snake].ang) * bot.snakeWidth
                        };
                        // heads
                        if (!canvas.pointInPoly(enemyHead, insidePolygon)) {
                enemyHeadDist2 = Math.min(
                        enemyHeadDist2,
                        canvas.getDistance2(enemyHead.x, enemyHead.y,
                                targetPoint.x, targetPoint.y),
                        canvas.getDistance2(enemyAhead.x, enemyAhead.y,
                                targetPoint.x, targetPoint.y)
                        );
                }
                // bodies
                let offsetSet = false;
                        let offset = 0.0;
                        let cpolbody = {};
                        for (let pts = 0, ptsNum = window.snakes[snake].pts.length;
                                pts < ptsNum; pts++) {
                if (!window.snakes[snake].pts[pts].dying) {
                let point = {
                x: window.snakes[snake].pts[pts].xx +
                        window.snakes[snake].pts[pts].fx,
                        y: window.snakes[snake].pts[pts].yy +
                        window.snakes[snake].pts[pts].fy
                };
                        while (!offsetSet || (enemyBodyOffsetDelta >= - bot.snakeWidth
                                && canvas.pointInPoly(point, cpolbody))) {
                if (!offsetSet) {
                offsetSet = true;
                } else {
                enemyBodyOffsetDelta -= 0.0625 * bot.snakeWidth;
                }
                offset = 0.5 * (bot.snakeWidth +
                        bot.getSnakeWidth(window.snakes[snake].sc)) +
                        enemyBodyOffsetDelta;
                        cpolbody = bot.bodyDangerZone(
                                offset, targetPoint, closePointNormal, closePointDist,
                                pastTargetPoint, closePoint);
                }
                }
                }
                }
                }
                var enemyHeadDist = Math.sqrt(enemyHeadDist2);
                        // plot inside polygon
                        if (window.visualDebugging) {
                for (let p = 0, l = insidePolygon.pts.length; p < l; p++) {
                let q = p + 1;
                        if (q == l) {
                q = 0;
                }
                canvas.drawLine(
                {x: insidePolygon.pts[p].x, y: insidePolygon.pts[p].y},
                {x: insidePolygon.pts[q].x, y: insidePolygon.pts[q].y},
                        'orange');
                }
                }

                // mark closePoint
                if (window.visualDebugging) {
                canvas.drawCircle(canvas.circle(
                        closePoint.x,
                        closePoint.y,
                        bot.snakeWidth * 0.25
                        ), 'white', false);
                }

                // mark safeZone
                if (window.visualDebugging) {
                canvas.drawCircle(canvas.circle(
                        targetPoint.x,
                        targetPoint.y,
                        bot.snakeWidth + 2 * targetPointFar
                        ), 'white', false);
                        canvas.drawCircle(canvas.circle(
                                targetPoint.x,
                                targetPoint.y,
                                0.2 * bot.snakeWidth
                                ), 'white', false);
                }

                // draw sample cpolbody
                if (window.visualDebugging) {
                let soffset = 0.5 * bot.snakeWidth;
                        let scpolbody = bot.bodyDangerZone(
                                soffset, targetPoint, closePointNormal,
                                closePointDist, pastTargetPoint, closePoint);
                        for (let p = 0, l = scpolbody.pts.length; p < l; p++) {
                let q = p + 1;
                        if (q == l) {
                q = 0;
                }
                canvas.drawLine(
                {x: scpolbody.pts[p].x, y: scpolbody.pts[p].y},
                {x: scpolbody.pts[q].x, y: scpolbody.pts[q].y},
                        'white');
                }
                }

                // TAKE ACTION

                // expand?
                let targetCourse = currentCourse + 0.25;
                        // enemy head nearby?
                        let headProx = - 1.0 - (2 * targetPointFar - enemyHeadDist) / bot.snakeWidth;
                        if (headProx > 0) {
                headProx = 0.125 * headProx * headProx;
                } else {
                headProx = - 0.5 * headProx * headProx;
                }
                targetCourse = Math.min(targetCourse, headProx);
                        // enemy body nearby?
                        targetCourse = Math.min(
                                targetCourse, targetCourse + (enemyBodyOffsetDelta - 0.0625 * bot.snakeWidth) /
                                bot.snakeWidth);
                        // small tail?
                        var tailBehind = bot.len - closePointT;
                        var targetDir = canvas.unitVector({
                        x: bot.opt.followCircleTarget.x - head.x,
                                y: bot.opt.followCircleTarget.y - head.y
                        });
                        var driftQ = targetDir.x * closePointNormal.x + targetDir.y * closePointNormal.y;
                        var allowTail = bot.snakeWidth * (2 - 0.5 * driftQ);
                        // a line in the direction of the target point
                        if (window.visualDebugging) {
                canvas.drawLine(
                { x: head.x, y: head.y },
                { x: head.x + allowTail * targetDir.x, y: head.y + allowTail * targetDir.y },
                        'red');
                }
                targetCourse = Math.min(
                        targetCourse,
                        (tailBehind - allowTail + (bot.snakeWidth - closePointDist)) /
                        bot.snakeWidth);
                        // far away?
                        targetCourse = Math.min(
                                targetCourse, - 0.5 * (closePointDist - 4 * bot.snakeWidth) / bot.snakeWidth);
                        // final corrections
                        // too fast in?
                        targetCourse = Math.max(targetCourse, - 0.75 * closePointDist / bot.snakeWidth);
                        // too fast out?
                        targetCourse = Math.min(targetCourse, 1.0);
                        var goalDir = {
                        x: closePointTangent.x * Math.cos(targetCourse) -
                                o * closePointTangent.y * Math.sin(targetCourse),
                                y: closePointTangent.y * Math.cos(targetCourse) +
                                o * closePointTangent.x * Math.sin(targetCourse)
                        };
                        var goal = {
                        x: head.x + goalDir.x * 4 * bot.snakeWidth,
                                y: head.y + goalDir.y * 4 * bot.snakeWidth
                        };
                        if (window.goalCoordinates
                                && Math.abs(goal.x - window.goalCoordinates.x) < 1000
                                && Math.abs(goal.y - window.goalCoordinates.y) < 1000) {
                window.goalCoordinates = {
                x: Math.round(goal.x * 0.25 + window.goalCoordinates.x * 0.75),
                        y: Math.round(goal.y * 0.25 + window.goalCoordinates.y * 0.75)
                };
                } else {
                window.goalCoordinates = {
                x: Math.round(goal.x),
                        y: Math.round(goal.y)
                };
                }

                canvas.setMouseCoordinates(canvas.mapToMouse(window.goalCoordinates));
                },
                // Sorting by property 'score' descending
                sortScore: function (a, b) {
                return b.score - a.score;
                },
                // Sorting by property 'sz' descending
                sortSz: function (a, b) {
                return b.sz - a.sz;
                },
                // Sorting by property 'distance' ascending
                sortDistance: function (a, b) {
                return a.distance - b.distance;
                },
                computeFoodGoal: function () {
                bot.foodAngles = [];
                        for (var i = 0; i < window.foods.length && window.foods[i] !== null; i++) {
                var f = window.foods[i];
                        if (!f.eaten &&
                                !(
                                        canvas.circleIntersect(
                                                canvas.circle(f.xx, f.yy, 2),
                                                bot.sidecircle_l) ||
                                        canvas.circleIntersect(
                                                canvas.circle(f.xx, f.yy, 2),
                                                bot.sidecircle_r))) {
                bot.addFoodAngle(f);
                }
                }

                bot.foodAngles.sort(bot.sortScore);
                        if (bot.foodAngles[0] !== undefined && bot.foodAngles[0].sz > 0) {
                bot.currentFood = { x: bot.foodAngles[0].x,
                        y: bot.foodAngles[0].y,
                        sz: bot.foodAngles[0].sz,
                        da: bot.foodAngles[0].da };
                } else {
                bot.currentFood = { x: bot.MID_X, y: bot.MID_Y, sz: 0 };
                }
                },
                foodAccel: function () {
                var aIndex = 0;
                        if (bot.currentFood && bot.currentFood.sz > bot.opt.foodAccelSz) {
                aIndex = bot.getAngleIndex(bot.currentFood.ang);
                        if (
                                bot.collisionAngles[aIndex] && bot.collisionAngles[aIndex].distance >
                                bot.currentFood.distance + bot.snakeRadius * bot.opt.radiusMult
                                && bot.currentFood.da < bot.opt.foodAccelDa) {
                return 1;
                }

                if (bot.collisionAngles[aIndex] === undefined
                        && bot.currentFood.da < bot.opt.foodAccelDa) {
                return 1;
                }
                }

                return bot.defaultAccel;
                },
                toCircle: function () {
                for (var i = 0; i < window.snake.pts.length && window.snake.pts[i].dying; i++);
                        const o = bot.opt.followCircleDirection;
                        var tailCircle = canvas.circle(
                                window.snake.pts[i].xx,
                                window.snake.pts[i].yy,
                                bot.headCircle.radius
                                );
                        if (window.visualDebugging) {
                canvas.drawCircle(tailCircle, 'blue', false);
                }

                window.setAcceleration(bot.defaultAccel);
                        bot.changeHeadingRel(o * Math.PI / 32);
                        if (canvas.circleIntersect(bot.headCircle, tailCircle)) {
                bot.stage = 'circle';
                }
                },
                every: function () {
                bot.MID_X = window.grd;
                        bot.MID_Y = window.grd;
                        bot.MAP_R = window.grd * 0.98;
                        bot.MAXARC = (2 * Math.PI) / bot.opt.arcSize;
                        if (bot.opt.followCircleTarget === undefined) {
                bot.opt.followCircleTarget = {
                x: bot.MID_X,
                        y: bot.MID_Y
                };
                }

                bot.sectorBoxSide = Math.floor(Math.sqrt(window.sectors.length)) * window.sector_size;
                        bot.sectorBox = canvas.rect(
                                window.snake.xx - (bot.sectorBoxSide / 2),
                                window.snake.yy - (bot.sectorBoxSide / 2),
                                bot.sectorBoxSide, bot.sectorBoxSide);
                        // if (window.visualDebugging) canvas.drawRect(bot.sectorBox, '#c0c0c0', true, 0.1);

                        bot.cos = Math.cos(window.snake.ang);
                        bot.sin = Math.sin(window.snake.ang);
                        bot.speedMult = window.snake.sp / bot.opt.speedBase;
                        bot.snakeRadius = bot.getSnakeWidth() / 2;
                        bot.snakeWidth = bot.getSnakeWidth();
                        bot.snakeLength = Math.floor(15 * (window.fpsls[window.snake.sct] + window.snake.fam /
                                window.fmlts[window.snake.sct] - 1) - 5);
                        bot.headCircle = canvas.circle(
                                window.snake.xx + bot.cos * Math.min(1, bot.speedMult - 1) *
                                bot.opt.radiusMult / 2 * bot.snakeRadius,
                                window.snake.yy + bot.sin * Math.min(1, bot.speedMult - 1) *
                                bot.opt.radiusMult / 2 * bot.snakeRadius,
                                bot.opt.radiusMult / 2 * bot.snakeRadius
                                );
                        if (window.visualDebugging) {
                canvas.drawCircle(bot.headCircle, 'blue', false);
                }

                bot.sidecircle_r = canvas.circle(
                        window.snake.lnp.xx -
                        ((window.snake.lnp.yy + bot.sin * bot.snakeWidth) -
                                window.snake.lnp.yy),
                        window.snake.lnp.yy +
                        ((window.snake.lnp.xx + bot.cos * bot.snakeWidth) -
                                window.snake.lnp.xx),
                        bot.snakeWidth * bot.speedMult
                        );
                        bot.sidecircle_l = canvas.circle(
                                window.snake.lnp.xx +
                                ((window.snake.lnp.yy + bot.sin * bot.snakeWidth) -
                                        window.snake.lnp.yy),
                                window.snake.lnp.yy -
                                ((window.snake.lnp.xx + bot.cos * bot.snakeWidth) -
                                        window.snake.lnp.xx),
                                bot.snakeWidth * bot.speedMult
                                );
                },
                // Main bot
                go: function () {
                bot.every();
                        if (bot.snakeLength < bot.opt.followCircleLength) {
                bot.stage = 'grow';
                }

                if (bot.currentFood && bot.stage !== 'grow') {
                bot.currentFood = undefined;
                }

                if (bot.stage === 'circle') {
                window.setAcceleration(bot.defaultAccel);
                        bot.followCircleSelf();
                } else if (bot.checkCollision() || bot.checkEncircle()) {
                if (bot.actionTimeout) {
                window.clearTimeout(bot.actionTimeout);
                        bot.actionTimeout = window.setTimeout(
                                bot.actionTimer, 1000 / bot.opt.targetFps * bot.opt.collisionDelay);
                }
                } else {
                if (bot.snakeLength > bot.opt.followCircleLength) {
                bot.stage = 'tocircle';
                }
                if (bot.actionTimeout === undefined) {
                bot.actionTimeout = window.setTimeout(
                        bot.actionTimer, 1000 / bot.opt.targetFps * bot.opt.actionFrames);
                }
                window.setAcceleration(bot.foodAccel());
                }
                },
                // Timer version of food check
                actionTimer: function () {
                if (window.playing && window.snake !== null && window.snake.alive_amt === 1) {
                if (bot.stage === 'grow') {
                bot.computeFoodGoal();
                        window.goalCoordinates = bot.currentFood;
                        canvas.setMouseCoordinates(canvas.mapToMouse(window.goalCoordinates));
                } else if (bot.stage === 'tocircle') {
                bot.toCircle();
                }
                }
                bot.actionTimeout = undefined;
                }
        };
        })(window);
// Main
        (function (window, document) {

        var graphicsMode = '4', //4 - customized high quality 3 - high quality, 2 - simple optimized, 1 - simple (mobile)
                graphicsModeChanged = true, //flag to indicate graphics mode has changed
                statsContainer = null, //reference to stats container
                xferContainer = null, //refernce to current transfer rate div
                zoomContainer = null, //reference to zoom div
                positionContainer = null, //reference to coordinates div
                targetContainer = null, //reference to coordinates of target when in bot mode
                ipContainer = null, //reference to current/last connected server div
                highscoreContainer = null, //reference to high score display
                clockContainer = null, //reference to clock container
                backgroundImage = - 1, //store the user selected background image
                randomizeBackground = false, //indicate whether or not to randomize background
                originalBackground = null, //store the game's default background image
                originalBackgroundCanvas = null, //store the game's default background canvas object
                backgroundImageChanged = true, //indicate if background image needs to be set
                clearedGlow = false, //store whether glow was attempted to be cleared
                highScore = 0, //store the user's current high score
                currentIP = null, //store the current connected server ip
                selectedServer = - 1, //store the user selected server ip
                selectedSkinOption = - 1, //Store skin option
                selectedSkin = null, //Store skin number
                manualServer = false, //store user manual server entry
                connectButtonOverride = false, //store whether the connect button click listener was overridden
                connectButton = null, //reference to the connect button
                retry = 0 //hold the current number of connection retries
                botContainer = null, //reference to bot function
                collisionDetectionContainer = null,
                radiusMultiplierContainer = null, //indicate radius
                autoRespawnContainer = null, // show auto respawn switch
                visualDebuggingContainer = null, //show visual debuggin switch
                logDebuggingContainer = null, //show debug options on/off
                mouseWheelContainer = '[Mouse Wheel] zoom', // show mouse zoom
                quickRespawnContainer = '[ESP] qucik respawn', // show quick respon key
                quitToMenuContainer = null,
                gfxEnabled = true, // reference to toggle graphic;
                gfxOverlay = null, // reference to graphic overlay
                fpsContainer = null, // set initial Frame per Second timer to '0'
                bot10scoresContainer = null;
                botOverlayContainer = null; // reference to bot overlay container
                //  Save the original slither.io functions so we can modify them, or reenable them later.
                //    original_onmouseDown = window.onmousedown
                original_oef = window.oef
                original_redraw = window.redraw
                original_onmousemove = window.onmousemove;
                window.oef = function () { };
                window.redraw = function () { };
                createCSS();
                stopLogoAnimation();
                // HTML code for Stats
                statsContainer = document.createElement('div');
                statsContainer.id = 'stats-container';
                statsContainer.innerHTML = ' \
                 <div id="fps-container"></div> \
            <div id="xfer-container"></div> \
            <div id="zoom-container"></div> \
            <div id="position-container"></div> \
            <div id="target-container"></div> \
            <div id="ip-container"></div> \
            <div id="highscore-container"></div> \
            <div id="clock-container"></div> \
        ';
                document.body.appendChild(statsContainer);
                fpsContainer = document.getElementById('fps-container');
                xferContainer = document.getElementById('xfer-container');
                zoomContainer = document.getElementById('zoom-container');
                positionContainer = document.getElementById('position-container');
                targetContainer = document.getElementById('target-container');
                ipContainer = document.getElementById('ip-container');
                highscoreContainer = document.getElementById('highscore-container');
                clockContainer = document.getElementById('clock-container');
                // HTML Code for Options
                optionsContainer = document.createElement('div');
                optionsContainer.id = 'options-container';
                optionsContainer.innerHTML = ' \
            <div id="bot-container"></div> \
            <div id="collision-detection-container"></div> \
            <div id="radius-multiplier-container"></div> \
            <div id="auto-respawn-container"></div> \
            <div id="visual-debugging-container"></div> \
            <div id="log-debugging-container"></div> \
            <div id="key-options-container"></div> \
       ';
                document.body.appendChild(optionsContainer);
                botContainer = document.getElementById('bot-container');
                collisionDetectionContainer = document.getElementById('collision-detection-container');
                radiusMultiplierContainer = document.getElementById('radius-multiplier-container');
                autoRespawnContainer = document.getElementById('auto-respawn-container');
                visualDebuggingContainer = document.getElementById('visual-debugging-container');
                logDebuggingContainer = document.getElementById('log-debugging-container');
                keyOptionsContainer = document.getElementById('key-options-container');
                // HTML Code for bot's 10 best scores
                bot10scoresContainer = document.createElement('div');
                bot10scoresContainer.id = 'bot10scores-container';
                bot10scoresContainer.innerHTML = ' \
                 <div id="bot10scores-container"></div> \
          ';
                document.body.appendChild(bot10scoresContainer);
                bot10scoresContainer = document.getElementById('bot10scores-container');
                // HTML Code for bot overlay container
                botOverlayContainer = document.createElement('div');
                botOverlayContainer.id = 'bot-overlay-container';
                botOverlayContainer.innerHTML = ' \
                 <div id="bot-overlay-container"></div> \
          ';
                document.body.appendChild(botOverlayContainer);
                botOverlayContainer = document.getElementById('bot-overlay-container');
                window.onkeydown = function (e) {
                if (window.playing) {
                // Letter `T` to toggle bot
                if (e.keyCode === 84) {
                bot.isBotEnabled = !bot.isBotEnabled;
                }
                // Letter 'U' to toggle debugging (console)
                if (e.keyCode === 85) {
                window.logDebugging = !window.logDebugging;
                        console.log('Log debugging set to: ' + window.logDebugging);
                        savePreference('logDebugging', window.logDebugging);
                }
                // Letter 'Y' to toggle debugging (visual)
                if (e.keyCode === 89) {
                window.visualDebugging = !window.visualDebugging;
                        console.log('Visual debugging set to: ' + window.visualDebugging);
                        savePreference('visualDebugging', window.visualDebugging);
                }
                // Letter 'I' to toggle autorespawn
                if (e.keyCode === 73) {
                window.autoRespawn = !window.autoRespawn;
                        console.log('Automatic Respawning set to: ' + window.autoRespawn);
                        savePreference('autoRespawn', window.autoRespawn);
                }
                // Letter 'H' to toggle hidden mode
                if (e.keyCode === 72) {
                // for future... may be help context
                }
                // Letter 'G' to toggle graphics
                if (e.keyCode === 71) {
                toggleGfx();
                }
                // 'tab' to toggle stats
                if (e.keyCode === 9) {
                e.preventDefault();
                        toggleStats();
                }
                // 'o' to toggle options
                if (e.keyCode === 79) {
                e.preventDefault();
                        toggleOptions();
                }
                // Letter 'A' to increase collision detection radius
                if (e.keyCode === 65) {
                bot.opt.radiusMult++;
                        console.log(
                                'radiusMult set to: ' + bot.opt.radiusMult);
                }
                // Letter 'S' to decrease collision detection radius
                if (e.keyCode === 83) {
                if (bot.opt.radiusMult > 1) {
                bot.opt.radiusMult--;
                        console.log(
                                'radiusMult set to: ' +
                                bot.opt.radiusMult);
                }
                }
                // Letter 'Z' to reset zoom
                if (e.keyCode === 90) {
                resetZoom();
                }
                // Letter 'Q' to quit to main menu
                if (e.keyCode === 81) {
                window.autoRespawn = false;
                        quit();
                }
                // 'ESC' to quickly respawn
                if (e.keyCode === 27) {
                bot.quickRespawn();
                }
                }
                };
                // Set menu
                setupMenu();
                // Override play button behavior
                customConnectButton();
                // Setup graphics
                setupGraphics();
                // Set custom name on the Liderboard
                setLeaderboard()
                // Update loop
                updateLoop();
                // Show FPS
                showFPS();
                // window.play_btn.btnf.addEventListener('click', userInterface.playButtonClickListener);
                // document.onkeydown = userInterface.onkeydown;
                //   window.onmousedown = onmousedown;
                //   window.addEventListener('mouseup', onmouseup);
                // Hide top score
                hideTop();
                // Load preferences
                loadPreference('logDebugging', false);
                loadPreference('visualDebugging', false);
                loadPreference('autoRespawn', false);
                // Listener for mouse wheel scroll - used for setZoom function
                if (/firefox/i.test(navigator.userAgent)) {
        document.body.addEventListener('DOMMouseScroll', setZoom);
        } else {
        document.body.addEventListener('mousewheel', setZoom);
        }


        // Start!
        oefTimer();
                /**
                 * Prevent laggy logo animation
                 */
                        function stopLogoAnimation() {
                        if (typeof window.showlogo_iv !== 'undefined') {
                        window.ncka = window.lgss = window.lga = 1;
                                clearInterval(window.showlogo_iv);
                                showLogo(true);
                        } else {
                        setTimeout(stopLogoAnimation, 25);
                        }
                        }
                /**
                 * Create stylesheet in head
                 */
                function createCSS() {
                var styleElement = document.createElement('style');
                        document.getElementsByTagName('head')[0].appendChild(styleElement);
                        styleElement.type = 'text/css';
                        var cssString = ' \
            body { \
                background-color: #000!important; \
                overflow-x:hidden; \
            } \
            #nbg { \
                display:none; \
                visibility:hidden; \
            } \
            #clq { \
                bottom:0!important; \
                height:auto!important; \
            } \
            #grqh { \
                top: auto!important; \
                right: auto!important; \
                bottom: 20px; \
                left: 150px; \
            } \
            #login { \
                /* margin-top:0!important; */ \
                position:relative!important; \
                width:auto!important; \
                height:auto!important; \
            } \
            #logo { \
                /* margin-top:30px!important; */ \
            } \
            #stats-container { \
                position:fixed; \
                right: 30px; \
                bottom: 120px; \
                opacity: 0-.35; \
                z-index: 7; \
                color: #FFF; \
                font: 12px Arial, Helvetica Neue, Helvetica, sans-serif; \
                text-align: right; \
            } \
            #custom-menu-container { \
                width:260px; \
                color:#8058D0; \
                background-color:#1E262E; \
                border-radius:29px; \
                font: 8px Lucida Sans Unicode, Lucida Grande, sans-serif; \
                text-align:center; \
                margin: 20px auto 0; \
                padding:10px 14px; \
            } \
            .custom-select-container { \
                background-color:#A5A5A5; \
                border-radius:10px; \
                margin:5px auto; \
                padding:5px 0; \
            } \
            .custom-select-container select { \
                width:100%; \
                background:none; \
                border:none; \
                outline:none; \
            } \
            #server-manual-input { \
                width: 100%; \
                display:none; \
                margin: 3px auto; \
                width: 98%; \
                background-color: #4C447C; \
                border: 1px solid #1E262E; \
                color: #e0e0ff; \
                border-radius: 3px; \
                padding: 3px 3px; \
            } \
            #hotkey-help { \
                margin:0; \
                padding:0; \
                display:flex; \
                flex-wrap:wrap; \
            } \
            #hotkey-help li { \
                display:inline; \
                white-space:nowrap; \
                flex-grow:1; \
            } \
            #clock-container { \
                font-weight:900; \
                font: 10px Courier New, Courier, monospace; \
            } \
              #options-container { \
                position:fixed; \
                left: 30px; \
                top: 120px; \
                opacity: 0-.35; \
                z-index: 7; \
                color: #FFF; \
                font: 12px Arial, Helvetica Neue, Helvetica, sans-serif; \
                text-align: left; \
            } \
            #bot10scores-container { \
                position:fixed; \
                left: 30px; \
                top: 310px; \
                opacity: 0-.35; \
                z-index: 7; \
                color: #FFF; \
                font: 12px Arial, Helvetica Neue, Helvetica, sans-serif; \
                text-align: left; \
            } \
            #bot-overlay-container { \
                position:fixed; \
                right: 5px; \
                bottom: 112px; \
                width: 150px; \
                height: 85px; \
                z-index: 999; \
                color: #C0C0C0; \
                font: 28px Arial, Helvetica Neue, Helvetica, sans-serif; \
                text-align: left; \
            } \
        ';
                        if (styleElement.styleSheet) {
                styleElement.styleSheet.cssText = cssString;
                } else {
                styleElement.appendChild(document.createTextNode(cssString));
                }
                }
                /**
                 * Toggle display of stats windows
                 */
                function toggleStats() {
                if (statsContainer.style.display == 'none') {
                statsContainer.style.display = 'block';
                } else {
                statsContainer.style.display = 'none';
                }
                }
                /**
                 * Toggle display of key options windows and bot 10 best scores
                 */
                function toggleOptions() {
                if (optionsContainer.style.display == 'none') {
                optionsContainer.style.display = 'block';
                        bot10scoresContainer.style.display = 'block';
                } else {
                optionsContainer.style.display = 'none';
                        bot10scoresContainer.style.display = 'none';
                }

                }

                /**
                 * Setup main menu
                 */
                function setupMenu() {

                var login = document.getElementById('login');
                        var playButtonContainer = document.getElementById('playh');
                        if (playButtonContainer) {
                // Load settings
                loadSettings();
                        //Create container
                        var menuContainer = document.createElement('div');
                        menuContainer.id = 'custom-menu-container';
                        menuContainer.innerHTML = '\
                <div class="custom-select-container"> \
                    <select id="server-select"> \
                        <option value="-1">Server: Default Closest</option> \
                        <option value="-2">Server: Random</option> \
                        <option value="-3">Server: Manual Input</option> \
                    </select> \
                    <input type"text" id="server-manual-input"> \
                </div> \
                <div class="custom-select-container"> \
                    <select id="graphics-select"> \
                        <option value="4">Graphics: customized</option> \
                        <option value="3">Graphics: normal</option> \
                        <option value="1">Graphics: low</option> \
                    </select> \
                </div> \
                <div class="custom-select-container" id="background-select-container"> \
                    <select id="background-select"> \
                        <option value="-2">Background Image: Random</option> \
                        <option value="-1">Background Image: Default</option> \
                        <option value="http://www.slithere.com/chrome2/grid.jpg">Grid</option> \
                        <option value="http://www.slithere.com/chrome2/whitegrid.png">White Grid</option> \
                        <option value="http://www.slithere.com/chrome2/blackgrid.png">Black Grid</option> \
                        <option value="http://www.slithere.com/chrome2/black.png">Black</option> \
                        <option value="http://www.slithere.com/chrome2/carts.jpg">Cats</option> \
                        <option value="http://www.slithere.com/chrome2/dirt.jpg">Dirt</option> \
                        <option value="http://www.slithere.com/chrome2/grass.jpg">Grass</option> \
                        <option value="http://www.slithere.com/chrome2/magma.jpg">Magma</option> \
                        <option value="http://www.slithere.com/chrome2/stonewall.jpg">Stonewall</option> \
                        <option value="http://www.slithere.com/chrome2/wood.jpg">Wood</option> \
                    </select> \
                </div> \
                <div class="custom-select-container" id="skin-select-container"> \
                    <select id="skin-select"> \
                        <option value="-1">Skins: Default Single Skin</option> \
                        <option value="1">Skins: Random Per Game</option> \
                        <option value="2">Skins: Rotate All</option> \
                    </select> \
                </div> \
                  ';
                        login.insertBefore(menuContainer, playButtonContainer);
                        //Capture and store nickname
                        var nick = document.getElementById('nick');
                        nick.addEventListener("input", getNick, false);
                        //Set graphics mode
                        var selectGraphics = document.getElementById('graphics-select');
                        selectGraphics.value = graphicsMode;
                        toggleBackgroundSelect();
                        selectGraphics.onchange = function() {
                        var mode = selectGraphics.value;
                                if (mode) {
                        graphicsMode = mode;
                                window.localStorage.setItem('graphics-mode', graphicsMode);
                                toggleBackgroundSelect();
                                graphicsModeChanged = true;
                                backgroundImageChanged = true;
                                if (graphicsMode != '4') {
                        randomizeBackground = false;
                        } else {
                        if (window.localStorage.getItem('background-image') == '-2') {
                        randomizeBackground = true;
                        }
                        }
                        }
                        };
                        //Set background options
                        var selectBackground = document.getElementById('background-select');
                        if (selectBackground) {
                selectBackground.value = backgroundImage;
                }
                selectBackground.onchange = function() {
                backgroundImage = selectBackground.value;
                        window.localStorage.setItem('background-image', backgroundImage);
                        graphicsModeChanged = true;
                        backgroundImageChanged = true;
                        randomizeBackground = (backgroundImage == '-2') ? true : false;
                };
                        //Set server options
                        getServersList();
                        var selectServer = document.getElementById('server-select');
                        var inputServerManual = document.getElementById('server-manual-input');
                        if (selectedServer) {
                selectServer.value = selectedServer;
                        inputServerManual.style.display = (selectedServer === '-3') ? 'block' : 'none';
                }

                if (manualServer && manualServer !== 'false') {
                inputServerManual.value = manualServer;
                }

                selectServer.onchange = function() {
                selectedServer = selectServer.value;
                        if (selectedServer === '-3') {
                inputServerManual.style.display = 'block';
                        inputServerManual.focus();
                } else {
                inputServerManual.style.display = 'none';
                }

                window.localStorage.setItem('server-selected', selectedServer);
                };
                        inputServerManual.onchange = function() {
                        manualServer = inputServerManual.value;
                                window.localStorage.setItem('server-manual', manualServer);
                        };
                        //Set skin options
                        var selectSkin = document.getElementById('skin-select');
                        if (selectedSkinOption) {
                selectSkin.value = selectedSkinOption;
                }
                selectSkin.onchange = function() {
                selectedSkinOption = selectSkin.value;
                        window.localStorage.setItem('skin-select', selectedSkinOption);
                }

                //Move this out of the way
                document.body.appendChild(document.getElementById('nbg'));
                        resizeView();
                } else {
                setTimeout(setupMenu, 100);
                }
                }

                /**
                 * Validate IP address format
                 */
                function validIP (ip) {
                return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
                }

                /**
                 * Toggle availablility of background image selection based on graphics mode
                 */
                function toggleBackgroundSelect() {
                if (graphicsMode == '4') {
                document.getElementById('background-select-container').style.display = 'block';
                } else {
                document.getElementById('background-select-container').style.display = 'none';
                }
                }

                /**
                 * Select a random background when the game loads
                 */
                function randomBackground() {
                var selectBackground = document.getElementById('background-select');
                        var backgroundOptions = selectBackground.getElementsByTagName('option');
                        var randomSelection = Math.floor(Math.random() * (backgroundOptions.length - 1)) + 1;
                        backgroundImage = backgroundOptions[randomSelection].value;
                        backgroundImageChanged = true;
                }

                /**
                 * Load settings from browser local storage
                 */
                function loadSettings() {
                // Unblocks all skins without the need for FB sharing.
                window.localStorage.setItem('edttsg', '1');
                        // Remove social
                        window.social.remove();
                        if (window.localStorage.getItem('nick') !== null) {
                var nick = window.localStorage.getItem('nick');
                        document.getElementById('nick').value = nick;
                }

                if (window.localStorage.getItem('high-score') !== null) {
                highScore = parseInt(window.localStorage.getItem('high-score'));
                        highscoreContainer.textContent = 'Hi Score: ' + highScore;
                }

                if (window.localStorage.getItem('graphics-mode') !== null) {
                var mode = parseInt(window.localStorage.getItem('graphics-mode'));
                        if (mode >= 1 && mode <= 4) {
                graphicsMode = mode;
                }
                } else {
                window.localStorage.setItem('graphics-mode', '4');
                }

                if (window.localStorage.getItem('background-image') !== null) {
                backgroundImage = window.localStorage.getItem('background-image');
                        randomizeBackground = (backgroundImage == '-2' && graphicsMode == '4') ? true : false;
                } else {
                window.localStorage.setItem('background-image', '-2');
                }

                if (window.localStorage.getItem('server-selected') !== null) {
                selectedServer = window.localStorage.getItem('server-selected');
                } else {
                window.localStorage.setItem('server-selected', selectedServer);
                }

                if (window.localStorage.getItem('server-manual') !== null) {
                manualServer = window.localStorage.getItem('server-manual');
                } else {
                window.localStorage.setItem('server-manual', false);
                }

                if (window.localStorage.getItem('skin-select') !== null) {
                selectedSkinOption = window.localStorage.getItem('skin-select');
                } else {
                window.localStorage.setItem('skin-select', selectedSkinOption);
                }

                if (window.localStorage.getItem('snakercv') !== null) {
                selectedSkin = window.localStorage.getItem('snakercv');
                }
                }

                /**
                 * Get and store user's nickname
                 */
                function getNick() {
                var nick = document.getElementById('nick').value;
                        window.localStorage.setItem('nick', nick);
                }

                /**
                 * Generate select list of game servers available
                 */
                function getServersList() {
                if (window.sos && window.sos.length > 0) {
                var selectSrv = document.getElementById('server-select');
                        for (var i = 0; i < sos.length; i++) {
                var srv = sos[i];
                        var option = document.createElement('option');
                        var serverLoopString = option.value = srv.ip + ':' + srv.po;
                        option.text = (i + 1) + '. ' + option.value;
                        selectSrv.appendChild(option);
                }
                } else {
                setTimeout(getServersList, 100);
                }
                }

                /**
                 * Override default connect button behavior to use custom server lists
                 */
                function customConnectButton() {
                connectBtn = document.getElementById('playh').getElementsByClassName('btnt')[0];
                        if (connectBtn && !connectButtonOverride) {
                // Force connect
                connectBtn.onclick = customConnect;
                } else {
                setTimeout(customConnectButton, 50);
                }
                }

                /**
                 * Custom connection function to allow for selection of server ip, random or default behavior
                 */
                function customConnect() {
                    resetZoom();
                if (!window.connect) {

                return;
                }

                if (!connectBtn.disabled) {
                connectBtn.disabled = true;
                } else {
                return false;
                }

                if (randomizeBackground) {
                randomBackground();
                }

                //Handle skin change options
                skinChange();
                        //Need to reset this before trying to reconnect
                        window.dead_mtm = - 1;
                        if (selectedServer != '-1') {
                window.forcing = true;
                        if (!window.bso) {
                window.bso = {};
                }
                }

                if (selectedServer == '-3') {
                //double check custom server entry
                manualServer = document.getElementById('server-manual-input').value;
                        window.localStorage.setItem('server-manual', manualServer);
                        var srv = manualServer.trim().split(':');
                        if (validIP(srv[0])) {
                window.bso.ip = srv[0];
                        window.bso.po = srv[1];
                } else {
                alert('The custom server you entered does not have a valid IP address format');
                        document.getElementById('server-manual-input').focus();
                        return false;
                }
                } else if (selectedServer == '-2') {
                var connectToServer = window.sos[Math.floor(Math.random() * window.sos.length)];
                        window.bso.ip = connectToServer.ip;
                        window.bso.po = connectToServer.po;
                        selectedServer = connectToServer.ip + ':' + connectToServer.po;
                        var selectSrv = document.getElementById('server-select').value = selectedServer;
                } else if (selectedServer != '-1') {
                var srv = selectedServer.trim().split(':');
                        window.bso.ip = srv[0];
                        window.bso.po = srv[1];
                }

                window.connect();
                        setTimeout(connectionStatus, 1000);
                }

                /**
                 * Loop to force retry of connection
                 */
                function connectionStatus() {
                if (!window.connecting || retry == 20) {
                window.forcing = false;
                        retry = 0;
                        connectBtn.disabled = false;
                        return;
                }
                retry++;
                        setTimeout(connectionStatus, 1000);
                }

                /**
                 * Force disconnect from game and return to menu
                 
                 function disconnect(resetGame) {
                 if (window.playing) {
                 window.want_close_socket = true;
                 window.dead_mtm = Date.now();
                 if (resetGame) {
                 window.resetGame();
                 }
                 }
                 } */

                /**
                 * Handle random or rotating to next skin
                 */
                function skinChange() {
                //Default
                if (selectedSkinOption == - 1) {
                return true;
                }

                //Check local storage again in case user switch skin via default interface
                selectedSkin = window.localStorage.getItem('snakercv');
                        //Random
                        if (selectedSkinOption == 1) {
                selectedSkin = Math.floor(Math.random() * (window.max_skin_cv + 1));
                        //Rotate
                } else if (selectedSkinOption == 2) {
                selectedSkin = (selectedSkin > window.max_skin_cv) ? 0 : parseInt(selectedSkin) + 1;
                }

                window.localStorage.setItem('snakercv', selectedSkin);
                }

                /**
                 * Set up graphics mode
                 */
                function setupGraphics() {
                //Store original background image
                if ((!originalBackground || !originalBackgroundCanvas) && window.bgp2 && window.ii) {
                originalBackground = "http://slither.io/s/bg45.jpg";
                        originalBackgroundCanvas = window.bgp2;
                }

                //Handle game graphics quality if needed
                if (graphicsModeChanged) {
                if (graphicsMode == '3') {
                window.grqi.style.display = 'block';
                        window.grqi.src = '/s/highquality.png';
                        window.want_quality = 1;
                        window.localStorage.setItem('qual', '1');
                        if (typeof window.high_quality !== 'undefined') {
                window.high_quality = true;
                }

                //Global alpha
                if (window.gla) {
                window.gla = 1;
                }

                if (typeof window.render_mode !== 'undefined') {
                window.render_mode = 2;
                }
                } else {
                if (graphicsMode == '4') {
                window.grqi.style.display = 'none';
                } else {
                window.grqi.style.display = 'block';
                        window.grqi.src = '/s/lowquality.png';
                }

                window.want_quality = 0;
                        window.localStorage.setItem('qual', '0');
                        if (typeof window.high_quality !== 'undefined') {
                window.high_quality = false;
                }

                //Global alpha
                if (window.gla) {
                window.gla = 0;
                }

                //Snake rendering
                if (typeof window.render_mode !== 'undefined') {
                if (graphicsMode == '4') {
                window.render_mode = 2;
                } else {
                window.render_mode = parseInt(graphicsMode);
                }
                }
                }

                graphicsModeChanged = false;
                }

                //Handle game background change if needed
                if (backgroundImageChanged && typeof window.bgp2 !== 'undefined' && typeof window.ii !== 'undefined') {
                //Customized high quality
                if (graphicsMode == '4') {
                clearGlow();
                        if (window.bgp2) {
                window.bgp2 = originalBackgroundCanvas;
                }

                if (window.ii) {
                if (backgroundImage != '-1') {
                window.ii.src = backgroundImage;
                } else {
                window.ii.src = originalBackground;
                }
                }
                //Default quality
                } else if (graphicsMode == '3') {
                if (window.ggbg && window.gbgmc) {
                window.ggbg = true;
                }
                if (window.bgp2) {
                window.bgp2 = originalBackgroundCanvas;
                }
                if (window.ii) {
                window.ii.src = originalBackground;
                }
                //Low quality / no background
                } else {
                clearGlow();
                        //Background picture
                        if (window.bgp2) {
                window.bgp2 = null;
                }
                }

                backgroundImageChanged = false;
                }
                }

                /**
                 * Clear glow from game
                 */
                function clearGlow() {
                if (window.ggbg) {
                window.ggbg = false;
                }
                if (clearedGlow) {
                return;
                } else if (window.gbgi && !clearedGlow) {
                window.gbgi.src = '';
                        window.gbgi.onload = null;
                        window.gbgi = null;
                        if (window.gbgmc) {
                window.gbgmc = null;
                }
                clearedGlow = true;
                } else {
                setTimeout(clearGlow, 50);
                }
                }

                /**
                 * Resize the view to the current browser window
                 */
                function resizeView() {
                if (window.resize) {
                window.lww = 0; // Reset width (force resize)
                        window.wsu = 0; // Clear ad space
                        window.resize();
                        var wh = Math.ceil(window.innerHeight);
                        if (wh < 800) {
                var login = document.getElementById('login');
                        window.lgbsc = wh / 800;
                        login.style.top = - (Math.round(wh * (1 - window.lgbsc) * 1E5) / 1E5) + 'px';
                        if (window.trf) {
                window.trf(login, 'scale(' + window.lgbsc + ',' + window.lgbsc + ')');
                }
                }
                } else {
                setTimeout(resizeView, 100);
                }
                }

                /**
                 * Show FPS
                 */
                function showFPS() {
                if (window.playing && fpsContainer && window.fps && window.lrd_mtm) {
                if (Date.now() - window.lrd_mtm > 970) {
                fpsContainer.textContent = 'FPS: ' + window.fps;
                }
                }
                setTimeout(showFPS, 30);
                }

                // Quit to menu
                function quit() {
                resetZoom();
                        if (window.playing && window.resetGame) {
                window.want_close_socket = true;
                        window.dead_mtm = 0;
                        if (window.play_btn) {
                window.play_btn.setEnabled(true);
                }
                window.resetGame();
                }
                }

                function handleTextColor(enabled) {
                return '<span style=\"color:' +
                        (enabled ? 'green;\">enabled' : 'red;\">disabled') + '</span>';
                }

                function toggleGfx() {
                if (gfxEnabled) {
                var c = window.mc.getContext('2d');
                        c.save();
                        c.fillStyle = "#000000",
                        c.fillRect(0, 0, window.mww, window.mhh),
                        c.restore();
                        var d = document.createElement('div');
                        d.style.position = 'fixed';
                        d.style.top = '50%';
                        d.style.left = '50%';
                        d.style.width = '200px';
                        d.style.height = '60px';
                        d.style.color = '#C0C0C0';
                        d.style.fontFamily = 'Consolas, Verdana';
                        d.style.zIndex = 999;
                        d.style.margin = '-30px 0 0 -100px';
                        d.style.fontSize = '28px';
                        d.style.textAlign = 'center';
                        d.className = 'nsi';
                        document.body.appendChild(d);
                        gfxOverlay = d;
                        window.lbf.innerHTML = '';
                } else {
                document.body.removeChild(gfxOverlay);
                        gfxOverlay = undefined;
                }

                gfxEnabled = !gfxEnabled;
                }

                function onFrameUpdate() {
                // Botstatus overlay
                if (window.playing && window.snake !== null) {
                let oContent = [];
                        botOverlayContainer.innerHTML = oContent.join('<br/>');
                        if (gfxOverlay) {
                let gContent = [];
                        gContent.push('<b>' + window.snake.nk + '</b>');
                        gContent.push(bot.snakeLength);
                        gContent.push('[' + window.rank + '/' + window.snake_count + ']');
                        gfxOverlay.innerHTML = gContent.join('<br/>');
                }

                }

                if (window.playing && window.visualDebugging) {
                // Only draw the goal when a bot has a goal.
                if (window.goalCoordinates && bot.isBotEnabled) {
                var headCoord = { x: window.snake.xx, y: window.snake.yy };
                        canvas.drawLine(
                                headCoord,
                                window.goalCoordinates,
                                'green');
                        canvas.drawCircle(window.goalCoordinates, 'red', true);
                }
                }
                }

                function oefTimer() {
                maintainZoom();
                        var start = Date.now();
                        original_oef();
                        if (window.gfxEnabled) {
                original_redraw();
                } else {
                window.visualDebugging = false;
                }

                if (window.playing && bot.isBotEnabled && window.snake !== null) {
                window.onmousemove = function () { };
                        bot.isBotRunning = true;
                        bot.go();
                } else if (bot.isBotEnabled && bot.isBotRunning) {
                bot.isBotRunning = false;
                        if (window.lastscore && window.lastscore.childNodes[1]) {
                bot.scores.push(parseInt(window.lastscore.childNodes[1].innerHTML));
                        bot.scores.sort(function (a, b) { return b - a; });
                        updateStats();
                }

                if (window.autoRespawn) {
                bot.connect();
                }
                }

                if (!bot.isBotEnabled || !bot.isBotRunning) {
                window.onmousemove = original_onmousemove;
                }

                onFrameUpdate();
                        if (!bot.isBotEnabled && !window.no_raf) {
                window.raf(oefTimer);
                } else {
                setTimeout(
                        oefTimer, (1000 / bot.opt.targetFps) - (Date.now() - start));
                }
                }
                // Update stats overlay.
                function updateStats() {
                var oContent = [];
                        var median;
                        if (bot.scores.length === 0) return;
                        median = Math.round((bot.scores[Math.floor((bot.scores.length - 1) / 2)] +
                                bot.scores[Math.ceil((bot.scores.length - 1) / 2)]) / 2);
                        oContent.push('games played: ' + bot.scores.length);
                        oContent.push('a: ' + Math.round(
                                bot.scores.reduce(function (a, b) { return a + b; }) / (bot.scores.length)) +
                                ' m: ' + median);
                        for (var i = 0; i < bot.scores.length && i < 10; i++) {
                oContent.push(i + 1 + '. ' + bot.scores[i]);
                }

                bot10scoresContainer.innerHTML = oContent.join('<br/>');
                }

                // Set leaderboard
                function setLeaderboard() {
                if (window.lbh) {
                window.lbh.textContent = ("MOD by Juice SN v." + GM_info.script.version);
                        window.lbh.style.fontSize = "20px";
                } else {
                setTimeout(setLeaderboard, 10000);
                }
                }
                // Save variable to local storage
                function savePreference(item, value) {
                window.localStorage.setItem(item, value);
                }

                // Load a variable from local storage
                function loadPreference(preference, defaultVar) {
                var savedItem = window.localStorage.getItem(preference);
                        if (savedItem !== null) {
                if (savedItem === 'true') {
                window[preference] = true;
                } else if (savedItem === 'false') {
                window[preference] = false;
                } else {
                window[preference] = savedItem;
                }
                window.log('Setting found for ' + preference + ': ' + window[preference]);
                } else {
                window[preference] = defaultVar;
                        window.log('No setting found for ' + preference +
                                '. Used default: ' + window[preference]);
                }
                return window[preference];
                }
                /*
                 function onmousedown(e) {
                 if (window.playing) {
                 switch (e.which) {
                 // "Left click" to manually speed up the slither
                 case 1:
                 bot.defaultAccel = 1;
                 if (!bot.isBotEnabled) {
                 original_onmouseDown(e);
                 }
                 break;
                 // "Right click" to toggle bot in addition to the letter "T"
                 case 3:
                 bot.isBotEnabled = !bot.isBotEnabled;
                 break;
                 }
                 } else {
                 original_onmouseDown(e);
                 }
                 }
                 
                 
                 function onmouseup() {
                 bot.defaultAccel = 0;
                 } */

                // Hide top score
                function hideTop() {
                var nsidivs = document.querySelectorAll('div.nsi');
                        for (var i = 0; i < nsidivs.length; i++) {
                if (nsidivs[i].style.top === '4px' && nsidivs[i].style.width === '300px') {
                nsidivs[i].style.visibility = 'hidden';
                        bot.isTopHidden = true;
                        window.topscore = nsidivs[i];
                }
                }
                }
                // Restores zoom to the default value.
                function resetZoom() {
                window.gsc = 0.9;
                        window.desired_gsc = 0.9;
                }
                // Adjusts zoom in response to the mouse wheel.
                function setZoom(e) {
                // Scaling ratio
                if (window.gsc) {
                window.gsc *= Math.pow(0.9, e.wheelDelta / - 120 || e.detail / 2 || 0);
                        window.desired_gsc = window.gsc;
                }
                }
                // Maintains Zoom
                function maintainZoom() {
                if (window.desired_gsc !== undefined) {
                window.gsc = window.desired_gsc;
                }
                }
                /**
                 * Update loop for real-time data
                 */
                function updateLoop() {
                setupGraphics();
                        if (window.playing) {
                var other_options = '[Mouse Wheel] zoom' + '<br>' + '[Z] reset zoom' + '<br>' + '[ESC] quick respawn' + '<br>'
                        + '[Tab] toggle stats' + '<br>' + '[G] toggle graphic' + '<br>' + '[Q] quit to menu' + '<br>' + '[O] toggle this window';
                        botContainer.innerHTML = ('[T] bot: ' + handleTextColor(bot.isBotEnabled));
                        radiusMultiplierContainer.textContent = ('[A/S] radius multiplier: ' + bot.opt.radiusMult);
                        autoRespawnContainer.innerHTML = ('[I] auto respawn: ' + handleTextColor(window.autoRespawn));
                        visualDebuggingContainer.innerHTML = ('[Y] visual debugging: ' + handleTextColor(window.visualDebugging));
                        logDebuggingContainer.innerHTML = ('[U] log debugging: ' + handleTextColor(window.logDebugging));
                        keyOptionsContainer.innerHTML = other_options;
                        positionContainer.textContent = 'X: ' + (~~window.view_xx || 0) + ' Y: ' + (~~window.view_yy || 0);
                        // Target coordinates are only in Bot mode
                        if (window.goalCoordinates && window.goalCoordinates.sz && bot.isBotEnabled) {
                targetContainer.textContent = ('Target X: ' + window.goalCoordinates.x + ' Y: ' + window.goalCoordinates.y + ' sz: ' + window.goalCoordinates.sz);
                } else {
                targetContainer.textContent = '';
                }
                if (window.bso && currentIP != window.bso.ip + ':' + window.bso.po) {
                currentIP = window.bso.ip + ":" + window.bso.po;
                        ipContainer.textContent = 'IP: ' + currentIP;
                }

                zoomContainer.textContent = 'Zoom: ' + window.gsc.toFixed(2);
                        xferContainer.textContent = 'BPS: ' + window.rdps;
                        var currentScore = Math.floor(150 * (window.fpsls[window.snake.sct] + window.snake.fam / window.fmlts[window.snake.sct] - 1) - 50) / 10;
                        if (currentScore > highScore) {
                highScore = currentScore;
                        localStorage.setItem('high-score', highScore);
                        highscoreContainer.textContent = 'Hi Score: ' + highScore;
                }
                } else {
                xferContainer.textContent = '';
                        zoomContainer.textContent = '';
                        positionContainer.textContent = '';
                }

                //Add/update clock
                var now = new Date();
                        var hours = now.getHours();
                        var minutes = now.getMinutes();
                        var seconds = now.getSeconds();
                        var timeValue = "" + ((hours > 12) ? hours - 12 : hours);
                        timeValue += ((minutes < 10) ? ':0' : ':') + minutes;
                        timeValue += ((seconds < 10) ? ':0' : ':') + seconds;
                        timeValue += (hours >= 12) ? ' PM' : ' AM';
                        clockContainer.textContent = timeValue;
                        //Fix this
                        if (typeof window.oncontextmenu === 'function') {
                window.oncontextmenu = null;
                }

                setTimeout(updateLoop, 1000);
                }
                })(window, document);
