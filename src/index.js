"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var axios_1 = require("axios");
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
var zod_1 = require("zod");
var API_KEY = "e8792e5503e74bfbb8a71435251108";
// Function to create a new MCP server instance
function getServer() {
    var _this = this;
    var server = new mcp_js_1.McpServer({
        name: "Weather MCP Server",
        version: "1.0.0",
    });
    // Define the weather tool
    server.tool("getWeather", { city: zod_1.z.string() }, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var res, data;
        var city = _b.city;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, axios_1.default.get("http://api.weatherapi.com/v1/current.json", {
                        params: { key: API_KEY, q: city, aqi: "no" },
                    })];
                case 1:
                    res = _c.sent();
                    data = res.data;
                    return [2 /*return*/, {
                            content: [{
                                    type: "text",
                                    text: "Weather in ".concat(data.location.name, ", ").concat(data.location.country, ": ").concat(data.current.temp_c, "\u00B0C, ").concat(data.current.condition.text),
                                }],
                        }];
            }
        });
    }); });
    return server;
}
var app = (0, express_1.express)();
app.use(express_1.express.json());
// POST endpoint for MCP requests
app.post("/mcp", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var server_1, transport_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                server_1 = getServer();
                transport_1 = new streamableHttp_js_1.StreamableHTTPServerTransport({
                    sessionIdGenerator: undefined,
                });
                res.on("close", function () {
                    console.log("Request closed");
                    transport_1.close();
                    server_1.close();
                });
                return [4 /*yield*/, server_1.connect(transport_1)];
            case 1:
                _a.sent();
                return [4 /*yield*/, transport_1.handleRequest(req, res, req.body)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error("Error handling MCP request:", error_1);
                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: "2.0",
                        error: {
                            code: -32603,
                            message: "Internal server error",
                        },
                        id: null,
                    });
                }
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// GET not allowed in stateless mode
app.get("/mcp", function (req, res) {
    res.status(405).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed" },
        id: null,
    });
});
// DELETE not allowed in stateless mode
app.delete("/mcp", function (req, res) {
    res.status(405).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed" },
        id: null,
    });
});
// Start the HTTP server
var PORT = 3000;
app.listen(PORT, function () {
    console.log("MCP Stateless HTTP Server running on http://localhost:".concat(PORT, "/mcp"));
});
